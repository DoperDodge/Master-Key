function FilterBar({ grade, setGrade, className, setClassName }) {
  const grades = ['All', '10th'];
  const classes = ['All', 'Bible', 'Spanish', 'English', 'Geometry', 'Chemistry', 'Algebra 2', 'Algebra 1'];

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
          onChange={e => setGrade(e.target.value)}
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
          onChange={e => setClassName(e.target.value)}
          style={{ width: 'auto', minWidth: '140px', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
        >
          {classes.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}

export default FilterBar;
