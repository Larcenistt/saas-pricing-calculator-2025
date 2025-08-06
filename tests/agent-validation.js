/**
 * Agent Framework Validation Tests
 * Tests each agent framework for errors and consistency
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

class AgentValidator {
  constructor(agentsDir) {
    this.agentsDir = agentsDir;
    this.errors = [];
    this.warnings = [];
    this.agents = [];
  }

  /**
   * Validate all agent files in the directory
   */
  async validateAll() {
    console.log('🔍 Starting Agent Framework Validation...\n');
    
    const files = fs.readdirSync(this.agentsDir)
      .filter(file => file.endsWith('.md'));
    
    for (const file of files) {
      await this.validateAgent(path.join(this.agentsDir, file));
    }
    
    this.printReport();
    return this.errors.length === 0;
  }

  /**
   * Validate a single agent file
   */
  async validateAgent(filePath) {
    const fileName = path.basename(filePath);
    const agentName = fileName.replace('.md', '');
    
    console.log(`Validating: ${agentName}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const agent = {
        name: agentName,
        file: fileName,
        path: filePath
      };
      
      // Check for YAML frontmatter
      if (!content.startsWith('---')) {
        this.errors.push({
          agent: agentName,
          type: 'MISSING_FRONTMATTER',
          message: 'Agent file missing YAML frontmatter'
        });
      } else {
        // Extract and validate frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          try {
            const metadata = yaml.load(frontmatterMatch[1]);
            agent.metadata = metadata;
            
            // Validate required fields
            if (!metadata.name) {
              this.errors.push({
                agent: agentName,
                type: 'MISSING_NAME',
                message: 'Agent metadata missing "name" field'
              });
            }
            
            if (!metadata.description) {
              this.errors.push({
                agent: agentName,
                type: 'MISSING_DESCRIPTION',
                message: 'Agent metadata missing "description" field'
              });
            }
            
            // Check name consistency
            if (metadata.name && metadata.name !== agentName.replace(/-/g, '-')) {
              this.warnings.push({
                agent: agentName,
                type: 'NAME_MISMATCH',
                message: `Metadata name "${metadata.name}" doesn't match filename "${agentName}"`
              });
            }
          } catch (e) {
            this.errors.push({
              agent: agentName,
              type: 'INVALID_YAML',
              message: `Invalid YAML frontmatter: ${e.message}`
            });
          }
        }
      }
      
      // Check content structure
      this.validateContent(content, agent);
      
      // Check for common issues
      this.checkCommonIssues(content, agent);
      
      this.agents.push(agent);
      
    } catch (error) {
      this.errors.push({
        agent: agentName,
        type: 'FILE_ERROR',
        message: `Failed to read agent file: ${error.message}`
      });
    }
  }

  /**
   * Validate agent content structure
   */
  validateContent(content, agent) {
    const requiredSections = [
      '## Core',  // Some variation of core philosophy/methodology
      '## Input',  // Input expectations
      '## Output', // Output format or delivery standards
    ];
    
    const hasCoreSections = requiredSections.some(section => 
      content.includes(section) || 
      content.includes(section.replace('## ', '### '))
    );
    
    if (!hasCoreSections) {
      this.warnings.push({
        agent: agent.name,
        type: 'STRUCTURE_WARNING',
        message: 'Agent may be missing standard sections (Core, Input, Output)'
      });
    }
    
    // Check for proper markdown structure
    const headingPattern = /^#{1,6} .+$/gm;
    const headings = content.match(headingPattern) || [];
    
    if (headings.length < 3) {
      this.warnings.push({
        agent: agent.name,
        type: 'STRUCTURE_WARNING',
        message: 'Agent has fewer than 3 headings - may lack proper structure'
      });
    }
    
    // Check for code examples or specifications
    const hasCodeBlocks = content.includes('```');
    const hasBulletPoints = content.includes('- ') || content.includes('* ');
    
    if (!hasCodeBlocks && !hasBulletPoints) {
      this.warnings.push({
        agent: agent.name,
        type: 'CONTENT_WARNING',
        message: 'Agent lacks code examples or detailed specifications'
      });
    }
  }

  /**
   * Check for common issues in agent files
   */
  checkCommonIssues(content, agent) {
    // Check for TODO or FIXME comments
    if (content.includes('TODO') || content.includes('FIXME')) {
      this.warnings.push({
        agent: agent.name,
        type: 'INCOMPLETE',
        message: 'Agent contains TODO or FIXME comments'
      });
    }
    
    // Check for broken markdown links
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const url = match[2];
      if (url.startsWith('#') || url.startsWith('http')) continue;
      
      // Check if local file reference exists
      if (!url.startsWith('http') && !fs.existsSync(url)) {
        this.warnings.push({
          agent: agent.name,
          type: 'BROKEN_LINK',
          message: `Possible broken link: ${url}`
        });
      }
    }
    
    // Check for excessive line length
    const lines = content.split('\n');
    const longLines = lines.filter(line => line.length > 120);
    if (longLines.length > 10) {
      this.warnings.push({
        agent: agent.name,
        type: 'FORMATTING',
        message: `${longLines.length} lines exceed 120 characters`
      });
    }
    
    // Check for consistent terminology
    const inconsistentTerms = [
      ['front-end', 'frontend'],
      ['back-end', 'backend'],
      ['data-base', 'database'],
      ['API', 'api', 'Api']
    ];
    
    for (const terms of inconsistentTerms) {
      const counts = terms.map(term => 
        (content.match(new RegExp(term, 'gi')) || []).length
      );
      
      if (counts.filter(c => c > 0).length > 1) {
        this.warnings.push({
          agent: agent.name,
          type: 'TERMINOLOGY',
          message: `Inconsistent terminology: ${terms.join(' vs ')}`
        });
      }
    }
    
    // Check for proper agent references
    if (content.includes('You are a') || content.includes('You are an')) {
      const rolePattern = /You are an? ([^.]+)/g;
      const roles = [];
      let roleMatch;
      
      while ((roleMatch = rolePattern.exec(content)) !== null) {
        roles.push(roleMatch[1]);
      }
      
      if (roles.length === 0) {
        this.warnings.push({
          agent: agent.name,
          type: 'ROLE_DEFINITION',
          message: 'Agent role not clearly defined'
        });
      }
    }
  }

  /**
   * Print validation report
   */
  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('AGENT VALIDATION REPORT');
    console.log('='.repeat(60) + '\n');
    
    console.log(`📊 Agents Validated: ${this.agents.length}`);
    console.log(`❌ Errors Found: ${this.errors.length}`);
    console.log(`⚠️  Warnings Found: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n🔴 ERRORS:');
      this.errors.forEach(error => {
        console.log(`  - [${error.agent}] ${error.type}: ${error.message}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n🟡 WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`  - [${warning.agent}] ${warning.type}: ${warning.message}`);
      });
    }
    
    console.log('\n📋 Agent Summary:');
    this.agents.forEach(agent => {
      const agentErrors = this.errors.filter(e => e.agent === agent.name).length;
      const agentWarnings = this.warnings.filter(w => w.agent === agent.name).length;
      const status = agentErrors > 0 ? '❌' : agentWarnings > 0 ? '⚠️' : '✅';
      
      console.log(`  ${status} ${agent.name}`);
      if (agent.metadata) {
        console.log(`     Description: ${agent.metadata.description?.substring(0, 60)}...`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('✅ All agents passed validation!');
    } else {
      console.log('❌ Validation failed. Please fix the errors above.');
    }
  }
}

// Run validation
const agentsDir = 'C:\\Users\\growl\\.claude\\.claude\\agents';
const validator = new AgentValidator(agentsDir);

validator.validateAll().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});