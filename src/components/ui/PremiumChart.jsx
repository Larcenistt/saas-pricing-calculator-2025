import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import GlassCard from './GlassCard';

// Premium Tooltip Component
const PremiumTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-glass-surface border border-glass-border rounded-xl p-4 backdrop-blur-xl shadow-premium">
      <div className="text-white font-semibold mb-2">{label}</div>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-neutral-300 text-sm">
            {entry.name}: {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Animated Line Chart
export function PremiumLineChart({ 
  data, 
  title, 
  lines = [], 
  formatValue,
  className,
  animate = true 
}) {
  return (
    <GlassCard variant="default" className={`p-6 ${className}`}>
      {title && (
        <motion.h3 
          className="text-xl font-semibold text-white mb-6"
          initial={animate ? { opacity: 0, y: -10 } : {}}
          animate={animate ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h3>
      )}
      
      <motion.div 
        className="h-80"
        initial={animate ? { opacity: 0, scale: 0.95 } : {}}
        animate={animate ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ fill: '#94a3b8' }}
              tickFormatter={formatValue}
            />
            <Tooltip 
              content={<PremiumTooltip formatter={formatValue} />}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {lines.map((line, index) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={3}
                dot={{ 
                  fill: line.color, 
                  strokeWidth: 2, 
                  r: 5,
                  fillOpacity: 0.8 
                }}
                activeDot={{ 
                  r: 8, 
                  fill: line.color,
                  stroke: 'rgba(255,255,255,0.8)',
                  strokeWidth: 2
                }}
                name={line.name}
                animationBegin={animate ? index * 200 : 0}
                animationDuration={animate ? 1500 : 0}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </GlassCard>
  );
}

// Animated Bar Chart
export function PremiumBarChart({ 
  data, 
  title, 
  bars = [], 
  formatValue,
  className,
  animate = true 
}) {
  return (
    <GlassCard variant="default" className={`p-6 ${className}`}>
      {title && (
        <motion.h3 
          className="text-xl font-semibold text-white mb-6"
          initial={animate ? { opacity: 0, y: -10 } : {}}
          animate={animate ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h3>
      )}
      
      <motion.div 
        className="h-80"
        initial={animate ? { opacity: 0, scale: 0.95 } : {}}
        animate={animate ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ fill: '#94a3b8' }}
              tickFormatter={formatValue}
            />
            <Tooltip 
              content={<PremiumTooltip formatter={formatValue} />}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {bars.map((bar, index) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                fill={bar.color}
                name={bar.name}
                radius={[4, 4, 0, 0]}
                animationBegin={animate ? index * 200 : 0}
                animationDuration={animate ? 1200 : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </GlassCard>
  );
}

// Animated Radar Chart for SaaS Metrics
export function PremiumRadarChart({ 
  data, 
  title, 
  metrics = [], 
  className,
  animate = true 
}) {
  return (
    <GlassCard variant="default" className={`p-6 ${className}`}>
      {title && (
        <motion.h3 
          className="text-xl font-semibold text-white mb-6"
          initial={animate ? { opacity: 0, y: -10 } : {}}
          animate={animate ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h3>
      )}
      
      <motion.div 
        className="h-80"
        initial={animate ? { opacity: 0, rotate: -5 } : {}}
        animate={animate ? { opacity: 1, rotate: 0 } : {}}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis 
              dataKey="metric" 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <PolarRadiusAxis 
              stroke="#64748b" 
              fontSize={10}
              tick={{ fill: '#64748b', fontSize: 10 }}
              domain={[0, 100]} 
            />
            <Tooltip content={<PremiumTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {metrics.map((metric, index) => (
              <Radar
                key={metric.key}
                name={metric.name}
                dataKey={metric.key}
                stroke={metric.color}
                fill={metric.color}
                fillOpacity={0.2}
                strokeWidth={2}
                animationBegin={animate ? index * 300 : 0}
                animationDuration={animate ? 1500 : 0}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </GlassCard>
  );
}

// Animated Area Chart
export function PremiumAreaChart({ 
  data, 
  title, 
  areas = [], 
  formatValue,
  className,
  animate = true 
}) {
  return (
    <GlassCard variant="default" className={`p-6 ${className}`}>
      {title && (
        <motion.h3 
          className="text-xl font-semibold text-white mb-6"
          initial={animate ? { opacity: 0, y: -10 } : {}}
          animate={animate ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h3>
      )}
      
      <motion.div 
        className="h-80"
        initial={animate ? { opacity: 0, scale: 0.95 } : {}}
        animate={animate ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              {areas.map((area, index) => (
                <linearGradient key={area.key} id={`gradient${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={area.color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={area.color} stopOpacity={0.1}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              tick={{ fill: '#94a3b8' }}
              tickFormatter={formatValue}
            />
            <Tooltip 
              content={<PremiumTooltip formatter={formatValue} />}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {areas.map((area, index) => (
              <Area
                key={area.key}
                type="monotone"
                dataKey={area.key}
                stroke={area.color}
                strokeWidth={2}
                fill={`url(#gradient${index})`}
                name={area.name}
                animationBegin={animate ? index * 200 : 0}
                animationDuration={animate ? 1500 : 0}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </GlassCard>
  );
}

// Premium Pie Chart
export function PremiumPieChart({ 
  data, 
  title, 
  colors = ['#10b981', '#1e40af', '#f59e0b', '#ef4444'],
  className,
  animate = true 
}) {
  return (
    <GlassCard variant="default" className={`p-6 ${className}`}>
      {title && (
        <motion.h3 
          className="text-xl font-semibold text-white mb-6 text-center"
          initial={animate ? { opacity: 0, y: -10 } : {}}
          animate={animate ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h3>
      )}
      
      <motion.div 
        className="h-80"
        initial={animate ? { opacity: 0, scale: 0.8 } : {}}
        animate={animate ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={40}
              paddingAngle={2}
              dataKey="value"
              animationBegin={animate ? 0 : undefined}
              animationDuration={animate ? 1200 : 0}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip 
              content={<PremiumTooltip />}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    </GlassCard>
  );
}

// Metric Display Card
export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon,
  variant = 'default',
  className,
  animate = true 
}) {
  const trendColor = trend > 0 ? 'text-success-400' : trend < 0 ? 'text-error-400' : 'text-neutral-400';
  const trendIcon = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20, scale: 0.9 } : {}}
      animate={animate ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, type: 'spring', damping: 25, stiffness: 300 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <GlassCard variant={variant} hover glow className={`p-6 text-center ${className}`}>
        {icon && (
          <div className="text-3xl mb-3 flex justify-center">
            {typeof icon === 'string' ? <span>{icon}</span> : icon}
          </div>
        )}
        
        <div className="text-sm text-neutral-400 mb-2 font-medium">{title}</div>
        
        <div className="text-3xl font-bold text-white mb-2">
          {value}
        </div>
        
        {subtitle && (
          <div className="text-sm text-neutral-300 mb-2">{subtitle}</div>
        )}
        
        {trend !== undefined && (
          <div className={`text-sm font-medium flex items-center justify-center gap-1 ${trendColor}`}>
            <span>{trendIcon}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}