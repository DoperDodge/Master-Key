function FilterBar({ grade, setGrade, className, setClassName }) {
  const grades = ['All', '10th'];
  const classes = ['All', 'Bible', 'Spanish', 'English', 'Geometry', 'Chemistry', 'Algebra 2', 'Algebra 1'];

  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Grade:
        <select value={grade} onChange={e => setGrade(e.target.value)} style={{ padding: '0.4rem' }}>
          {grades.map(g => <option key={g} value={g === 'All' ? '' : g}>{g}</option>)}
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Class:
        <select value={className} onChange={e => setClassName(e.target.value)} style={{ padding: '0.4rem' }}>
          {classes.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
        </select>
      </label>
    </div>
  );
}

export default FilterBar;
