
// Test project creation for PlotTab testing
const createTestProject = () => {
  const store = window.useBookCraftStore?.getState?.();
  if (store) {
    store.addProject({
      title: 'PlotTab Performance Test Project',
      genre: 'Science Fiction',
      visualStyle: 'Modern'
    });
    console.log('Test project created');
    return true;
  }
  console.error('Store not found');
  return false;
};

// Make available globally
window.createTestProject = createTestProject;
console.log('Test project creator loaded. Run createTestProject() in console.');
