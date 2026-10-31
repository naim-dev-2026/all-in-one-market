import React from 'react';

const SidebarDrawer = ({ isOpen, onClose, selectedCategory, onSelectCategory, nestedCategories, expandedCategory, onToggleExpand }) => {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 2000,
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none', transition: 'opacity 0.3s ease',
        }}
      />

      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, width: '300px', backgroundColor: '#ffffff', zIndex: 2001,
        boxShadow: '4px 0 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Departments</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', outline: 'none' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => { onSelectCategory('all'); onClose(); }}
            style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: selectedCategory === 'all' ? '700' : '500', backgroundColor: selectedCategory === 'all' ? '#e0f2fe' : 'transparent', color: selectedCategory === 'all' ? '#0369a1' : '#334155', cursor: 'pointer', outline: 'none' }}
          >
            🌐 All Categories
          </button>

          {nestedCategories.map((cat) => {
            const hasSubs = cat.subItems && cat.subItems.length > 0;
            const isExpanded = expandedCategory === cat.id;
            const isMainSelected = String(selectedCategory) === String(cat.id);

            return (
              <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isMainSelected ? '#e0f2fe' : 'transparent', borderRadius: '8px' }}>
                  <button
                    onClick={() => { onSelectCategory(cat.id); onClose(); }}
                    style={{ flex: 1, padding: '12px', textAlign: 'left', border: 'none', background: 'none', fontSize: '14px', fontWeight: isMainSelected ? '700' : '500', color: isMainSelected ? '#0369a1' : '#334155', cursor: 'pointer', outline: 'none' }}
                  >
                    📁 {cat.cleanName}
                  </button>
                  {hasSubs && (
                    <button onClick={() => onToggleExpand(cat.id)} style={{ padding: '12px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px', outline: 'none' }}>
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  )}
                </div>

                {hasSubs && isExpanded && (
                  <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '2px solid #e2e8f0', marginLeft: '16px', marginTop: '4px' }}>
                    {cat.subItems.map((sub) => {
                      const isSubSelected = String(selectedCategory) === String(sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => { onSelectCategory(sub.id); onClose(); }}
                          style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: isSubSelected ? '700' : '500', backgroundColor: isSubSelected ? '#f0f9ff' : 'transparent', color: isSubSelected ? '#0369a1' : '#475569', cursor: 'pointer', outline: 'none' }}
                        >
                          🔹 {sub.cleanName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default SidebarDrawer;
