import fs from 'fs';
import path from 'path';

// 1. Rewrite Dashboard.tsx
const dashboardPath = path.resolve('e:/Labmetrix/Project-1/frontend/src/components/dashboard/Dashboard.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

if (!dashboardContent.includes("import { motion } from 'framer-motion';")) {
  dashboardContent = dashboardContent.replace(
    "import { useNavigate, useOutletContext } from 'react-router-dom';",
    "import { useNavigate, useOutletContext } from 'react-router-dom';\nimport { motion } from 'framer-motion';"
  );
  
  // Add variants
  dashboardContent = dashboardContent.replace(
    "const navigate = useNavigate();",
    `const navigate = useNavigate();
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };`
  );

  // Wrap sections in empty state
  dashboardContent = dashboardContent.replace(
    `    return (
      <div className="space-y-xxl">`,
    `    return (
      <motion.div 
        className="space-y-xxl"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >`
  );

  dashboardContent = dashboardContent.replace(
    `            </MetaCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xxl">`,
    `            </MetaCard>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-xxl"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >`
  );

  dashboardContent = dashboardContent.replace(
    `      </MetaCard>

    </div>
  );
}`,
    `      </MetaCard>

    </motion.div>
  );
}`
  );

  // Add itemVariants to sections
  dashboardContent = dashboardContent.replace(
    /className="relative overflow-hidden rounded-xxxl border border-hairline-soft"/g,
    `variants={itemVariants} className="relative overflow-hidden rounded-xxxl border border-hairline-soft"`
  );

  dashboardContent = dashboardContent.replace(
    /className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-sm"/g,
    `variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-sm"`
  );

  dashboardContent = dashboardContent.replace(
    /className="grid grid-cols-1 lg:grid-cols-3 gap-xl"/g,
    `variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-xl"`
  );

  dashboardContent = dashboardContent.replace(
    /className="space-y-md p-lg"/g,
    `variants={itemVariants} className="space-y-md p-lg"`
  );

  // Change div to motion.div for the sections where we added variants
  dashboardContent = dashboardContent.replace(
    /<div\n\s*variants={itemVariants} className="relative overflow-hidden rounded-xxxl border border-hairline-soft"/g,
    `<motion.div\n        variants={itemVariants} className="relative overflow-hidden rounded-xxxl border border-hairline-soft"`
  );
  dashboardContent = dashboardContent.replace(
    /<\/div>\n\n\s*{\/\* ─── Section 2/g,
    `</motion.div>\n\n      {/* ─── Section 2`
  );
  
  dashboardContent = dashboardContent.replace(
    /<div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-sm">/g,
    `<motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-sm">`
  );
  dashboardContent = dashboardContent.replace(
    /<\/div>\n\n\s*{\/\* ─── Section 3/g,
    `</motion.div>\n\n      {/* ─── Section 3`
  );

  dashboardContent = dashboardContent.replace(
    /<div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-xl">/g,
    `<motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-xl">`
  );
  dashboardContent = dashboardContent.replace(
    /<\/div>\n\n\s*{\/\* ─── Section 4/g,
    `</motion.div>\n\n      {/* ─── Section 4`
  );

  dashboardContent = dashboardContent.replace(
    /<MetaCard variants={itemVariants} className="space-y-md p-lg">/g,
    `<motion.div variants={itemVariants}><MetaCard className="space-y-md p-lg">`
  );
  dashboardContent = dashboardContent.replace(
    /<\/ul>\n\s*<\/div>\n\s*\)}\n\s*<\/MetaCard>\n\n\s*<\/motion.div>/g,
    `</ul>\n          </div>\n        )}\n      </MetaCard></motion.div>\n\n    </motion.div>`
  );

  fs.writeFileSync(dashboardPath, dashboardContent, 'utf8');
  console.log("Dashboard.tsx updated with Framer Motion.");
}

// 2. LandingPage spacing fix
const landingPagePath = path.resolve('e:/Labmetrix/Project-1/frontend/src/components/layout/LandingPage.tsx');
let lpContent = fs.readFileSync(landingPagePath, 'utf8');
if (!lpContent.includes("w-full overflow-hidden")) {
  lpContent = lpContent.replace(/<div className="lp-root">/, '<div className="lp-root w-full overflow-hidden">');
  fs.writeFileSync(landingPagePath, lpContent, 'utf8');
  console.log("LandingPage.tsx updated to fix mobile overflow.");
}
