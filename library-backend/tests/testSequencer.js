const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    const orderMap = {
      'unit': 1,
      'integration': 2,
      'security': 3,
      'performance': 4,
      'e2e': 5
    };

    return Array.from(tests).sort((testA, testB) => {
      const typeA = this.getTestType(testA.path);
      const typeB = this.getTestType(testB.path);
      
      const orderA = orderMap[typeA] || 999;
      const orderB = orderMap[typeB] || 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return testA.path.localeCompare(testB.path);
    });
  }

  getTestType(path) {
    if (path.includes('/unit/')) return 'unit';
    if (path.includes('/integration/')) return 'integration';
    if (path.includes('/security/')) return 'security';
    if (path.includes('/performance/')) return 'performance';
    if (path.includes('/e2e/')) return 'e2e';
    return 'other';
  }
}

module.exports = CustomSequencer;