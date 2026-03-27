const GRADE_CLASSES = {
  '9th': ['Algebra'],
  '10th': ['Bible', 'Spanish', 'English', 'Geometry', 'Chemistry', 'Algebra 2', 'Algebra 1'],
  '11th': ['Algebra 2'],
  '12th': [],
};

const KEY_TYPES = ['Homework', 'Classwork', 'Notes', 'Quiz', 'Test', 'Miscellaneous', 'Lab'];

function FilterBar({ grade, setGrade, className, setClassName, keyType, setKeyType }) {
  const grades = ['All', '9th', '10th', '11th', '12th'];

  // Build class list based on selected grade
  let availableClasses;
  if (grade) {
    availableClasses = GRADE_CLASSES[grade] || [];
  } else {
    availableClasses = [...new Set(Object.values(GRADE_CLASSES).flat())];
  }

  // Build key type list — show Lab only if Chemistry is selected or no class filter
  let availableKeyTypes = KEY_TYPES.filter(t => {
    if (t === 'Lab') return !className || className === 'Chemistry';
    return true;
  });

  // Reset class if it's not valid for new grade
  const handleGradeChange = (newGrade) => {
    setGrade(newGrade);
    if (newGrade) {
      const classes = GRADE_CLASSES[newGrade] || [];
      if (className && !classes.includes(className)) {
        setClassName('');
      }
    }
  };

  // Reset key type if Lab selected but class changed away from Chemistry
  const handleClassChange = (newClass) => {
    setClassName(newClass);
    if (keyType === 'Lab' && newClass && newClass !== 'Chemistry') {
      setKeyType('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      padding: '1rem 1.25rem',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="label" style={{ margin: 0, fontSize: '0.8rem' }}>Grade</span>
        <select
          className="select"
          value={grade}
          onChange={e => handleGradeChange(e.target.value)}
          style={{ width: 'auto', minWidth: '100px', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
        >
          {grades.map(g => <option key={g} value={g === 'All' ? '' : g}>{g}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="label" style={{ margin: 0, fontSize: '0.8rem' }}>Class</span>
        <select
          className="select"
          value={className}
          onChange={e => handleClassChange(e.target.value)}
          style={{ width: 'auto', minWidth: '140px', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
        >
          <option value="">All</option>
          {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="label" style={{ margin: 0, fontSize: '0.8rem' }}>Type</span>
        <select
          className="select"
          value={keyType}
          onChange={e => setKeyType(e.target.value)}
          style={{ width: 'auto', minWidth: '140px', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
        >
          <option value="">All</option>
          {availableKeyTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );
}

export default FilterBar;
