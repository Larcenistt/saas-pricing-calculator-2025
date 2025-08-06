import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors';
import { config } from '../config/secrets';
import { emailService } from './email.service';
import { analyticsService } from './analytics.service';

const prisma = new PrismaClient();
const stripe = new Stripe(config.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get or create Stripe customer
      let customerId = user.subscription?.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
      }

      // Get price based on plan
      const priceId = this.getPriceId(planId);

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
          planId: planId,
        },
        subscription_data: {
          trial_period_days: planId === 'PROFESSIONAL' ? 14 : undefined,
          metadata: {
            userId: user.id,
            planId: planId,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
        },
      });

      // Track checkout initiated
      await analyticsService.track('checkout_initiated', {
        userId: user.id,
        planId: planId,
        sessionId: session.id,
      });

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new AppError('Failed to create checkout session', 500);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, payload: string) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new AppError('Invalid webhook signature', 400);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle successful checkout
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    try {
      // Update or create subscription record
      await prisma.subscription.upsert({
        where: { userId },
        update: {
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          plan: planId as any,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        create: {
          userId,
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          plan: planId as any,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Send welcome email
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await emailService.sendWelcomeEmail(user.email, user.name || 'Customer', planId);
      }

      // Track conversion
      await analyticsService.track('subscription_created', {
        userId,
        planId,
        revenue: this.getPlanPrice(planId),
      });

      console.log(`Subscription created for user ${userId} with plan ${planId}`);
    } catch (error) {
      console.error('Error handling checkout completion:', error);
    }
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    
    if (!userId) return;

    try {
      const planId = this.getPlanFromPriceId(subscription.items.data[0].price.id);
      
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          plan: planId,
          status: this.mapStripeStatus(subscription.status),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });

      // Track plan change
      await analyticsService.track('subscription_updated', {
        userId,
        planId,
        status: subscription.status,
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'CANCELLED',
          cancelAtPeriodEnd: false,
        },
      });

      const userId = subscription.metadata?.userId;
      if (userId) {
        // Send cancellation email
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          await emailService.sendCancellationEmail(user.email, user.name || 'Customer');
        }

        // Track churn
        await analyticsService.track('subscription_cancelled', {
          userId,
          reason: subscription.cancellation_details?.reason || 'unknown',
        });
      }
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    
    try {
      // Update subscription payment status
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: 'ACTIVE',
        },
      });

      // Track payment
      await analyticsService.track('payment_succeeded', {
        subscriptionId,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
      });
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
        include: { user: true },
      });

      if (subscription) {
        // Update status
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'PAST_DUE',
          },
        });

        // Send payment failed email
        await emailService.sendPaymentFailedEmail(
          subscription.user.email,
          subscription.user.name || 'Customer'
        );

        // Track failed payment
        await analyticsService.track('payment_failed', {
          userId: subscription.userId,
          amount: invoice.amount_due / 100,
        });
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle trial ending soon
   */
  private async handleTrialWillEnd(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    
    if (!userId) return;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        // Send trial ending email
        await emailService.sendTrialEndingEmail(
          user.email,
          user.name || 'Customer',
          new Date(subscription.trial_end! * 1000)
        );

        // Track trial ending
        await analyticsService.track('trial_ending', {
          userId,
          trialEndDate: new Date(subscription.trial_end! * 1000),
        });
      }
    } catch (error) {
      console.error('Error handling trial ending:', error);
    }
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    // Similar to checkout completed
    await this.handleSubscriptionUpdated(subscription);
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(userId: string, returnUrl: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription || !subscription.stripeCustomerId) {
        throw new AppError('No subscription found', 404);
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      return {
        portalUrl: session.url,
      };
    } catch (error) {
      console.error('Portal session error:', error);
      throw new AppError('Failed to create portal session', 500);
    }
  }

  /**
   * Get price ID from plan
   */
  private getPriceId(planId: string): string {
    const priceMap: Record<string, string> = {
      STARTER: config.STRIPE_PRICE_ID_STARTER!,
      PROFESSIONAL: config.STRIPE_PRICE_ID_PROFESSIONAL!,
      ENTERPRISE: config.STRIPE_PRICE_ID_ENTERPRISE!,
    };

    return priceMap[planId] || config.STRIPE_PRICE_ID_STARTER!;
  }

  /**
   * Get plan from price ID
   */
  private getPlanFromPriceId(priceId: string): string {
    const planMap: Record<string, string> = {
      [config.STRIPE_PRICE_ID_STARTER!]: 'STARTER',
      [config.STRIPE_PRICE_ID_PROFESSIONAL!]: 'PROFESSIONAL',
      [config.STRIPE_PRICE_ID_ENTERPRISE!]: 'ENTERPRISE',
    };

    return planMap[priceId] || 'STARTER';
  }

  /**
   * Get plan price
   */
  private getPlanPrice(planId: string): number {
    const prices: Record<string, number> = {
      STARTER: 19,
      PROFESSIONAL: 49,
      ENTERPRISE: 199,
    };

    return prices[planId] || 0;
  }

  /**
   * Map Stripe status to our status
   */
  private mapStripeStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELLED',
      incomplete: 'PENDING',
      incomplete_expired: 'CANCELLED',
      trialing: 'TRIALING',
      unpaid: 'PAST_DUE',
    };

    return statusMap[stripeStatus] || 'PENDING';
  }
}

export const stripeService = new StripeService();