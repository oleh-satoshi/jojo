import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [scanCount, setScanCount] = useState(0);
  const [showFolders, setShowFolders] = useState(false);
  const [folders, setFolders] = useState([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [qrCodes, setQrCodes] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [activeFolderMenu, setActiveFolderMenu] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  // Get query parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const telegramId = params.get('telegramId');
    const totalScans = params.get('totalScans') || 0;
    
    if (telegramId) {
      localStorage.setItem('telegramId', telegramId);
    }
    
    if (totalScans) {
      localStorage.setItem('totalScans', totalScans);
      setScanCount(Number(totalScans));
    } else {
      setScanCount(Number(localStorage.getItem('totalScans') || 0));
    }
    
    // Sample folder structure with nesting
    const sampleFolders = [
      {
        id: "1",
        name: "Личные QR",
        level: 0,
        parentId: null,
      },
      {
        id: "2",
        name: "Рабочие QR",
        level: 0,
        parentId: null,
        children: ["3", "4"]
      },
      {
        id: "3",
        name: "Клиенты",
        level: 1,
        parentId: "2",
      },
      {
        id: "4",
        name: "Встречи",
        level: 1,
        parentId: "2",
        children: ["5"]
      },
      {
        id: "5",
        name: "Важные",
        level: 2,
        parentId: "4",
      }
    ];
    
    setFolders(sampleFolders);
    localStorage.setItem('folders', JSON.stringify(sampleFolders));
    
    // Sample QR code data for demonstration
    setQrCodes([
      {
        id: "1",
        name: "Get Free Coffee",
        link: "https://example.com/starbucks",
        scanNumber: 42,
        folderId: "5",
        imageUrl: "https://api.qrserver.com/v1/create-qr-code/?data=coffee"
      },
      {
        id: "2",
        name: "Website QR",
        link: "https://example.com",
        scanNumber: 23,
        folderId: null,
        imageUrl: "https://api.qrserver.com/v1/create-qr-code/?data=example"
      }
    ]);
  }, []);

  const toggleFolders = () => {
    setShowFolders(!showFolders);
  };

  const toggleFolderExpansion = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const toggleFolderMenu = (folderId, e) => {
    e.stopPropagation();
    setActiveFolderMenu(activeFolderMenu === folderId ? null : folderId);
  };

  const handleCreateFolder = () => {
    setShowNewFolderInput(true);
  };

  const saveNewFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        level: 0,
        parentId: null
      };
      
      const newFolders = [...folders, newFolder];
      setFolders(newFolders);
      localStorage.setItem('folders', JSON.stringify(newFolders));
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };

  const deleteFolder = (folderId, e) => {
    if (e) e.stopPropagation();
    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    setFolders(updatedFolders);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    setActiveFolderMenu(null);
  };

  const startRenameFolder = (folderId, currentName, e) => {
    if (e) e.stopPropagation();
    setEditingFolder(folderId);
    setEditingFolderName(currentName);
    setActiveFolderMenu(null);
  };

  const saveRenameFolder = (e) => {
    if (e) e.preventDefault();
    if (editingFolderName.trim() && editingFolder) {
      const updatedFolders = folders.map(folder => 
        folder.id === editingFolder ? { ...folder, name: editingFolderName } : folder
      );
      setFolders(updatedFolders);
      localStorage.setItem('folders', JSON.stringify(updatedFolders));
      setEditingFolder(null);
    }
  };

  const deleteFolderWithQRs = (folderId, e) => {
    if (e) e.stopPropagation();
    // Delete folder and remove QR codes in that folder
    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    const updatedQRs = qrCodes.filter(qr => qr.folderId !== folderId);
    
    setFolders(updatedFolders);
    setQrCodes(updatedQRs);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    setActiveFolderMenu(null);
  };

  const createQRInFolder = (folderId, e) => {
    if (e) e.stopPropagation();
    // Redirect to QR creation page with folder ID
    window.location.href = `qr_shape_picker.html?folderId=${folderId}`;
  };

  const renderFolders = (parentId = null, level = 0) => {
    const foldersForLevel = folders.filter(folder => folder.parentId === parentId);
    if (foldersForLevel.length === 0) return null;
    
    return (
      <div className="folder-tree-level">
        {foldersForLevel.map((folder, index) => {
          const hasChildren = folders.some(f => f.parentId === folder.id);
          const isExpanded = expandedFolders[folder.id];
          const isLastInLevel = index === foldersForLevel.length - 1;
          
          return (
            <div key={folder.id} className={`folder-branch ${isLastInLevel ? 'last-branch' : ''}`}>
              <div 
                className="folder-item"
                onClick={() => toggleFolderExpansion(folder.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="folder-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-9l-2-3H4.5A1.5 1.5 0 003 7.5z" />
                </svg>
                
                {editingFolder === folder.id ? (
                  <form onSubmit={saveRenameFolder} className="rename-form">
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="rename-input"
                    />
                    <button 
                      type="submit" 
                      className="rename-save-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRenameFolder();
                      }}
                    >
                      ✓
                    </button>
                  </form>
                ) : (
                  <span className="folder-name">{folder.name}</span>
                )}
                
                <div className="folder-actions">
                  <button 
                    className="add-qr-to-folder-btn" 
                    onClick={(e) => createQRInFolder(folder.id, e)}
                  >
                    Добавить QR
                  </button>
                  
                  <button className="folder-menu-btn" onClick={(e) => toggleFolderMenu(folder.id, e)}>
                    ⋯
                  </button>
                  
                  {activeFolderMenu === folder.id && (
                    <div className="folder-menu" onClick={(e) => e.stopPropagation()}>
                      <div className="menu-item" onClick={(e) => startRenameFolder(folder.id, folder.name, e)}>
                        Переименовать
                      </div>
                      <div className="menu-item" onClick={(e) => deleteFolder(folder.id, e)}>
                        Удалить папку
                      </div>
                      <div className="menu-item" onClick={(e) => deleteFolderWithQRs(folder.id, e)}>
                        Удалить со всеми QR
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {hasChildren && isExpanded && (
                <div className="subfolder-container">
                  {renderFolders(folder.id, level + 1)}
                </div>
              )}
              
              {/* Show QR codes in this folder if expanded */}
              {isExpanded && qrCodes
                .filter(qr => qr.folderId === folder.id)
                .map(qr => (
                  <div key={qr.id} className="qr-in-folder">
                    <div className="qr-card">
                      <div className="qr-left">
                        <img src={qr.imageUrl} alt="QR Code" />
                        <div className="qr-info">
                          <strong>{qr.name}</strong>
                          <span>{qr.link.replace('https://', '')}</span>
                        </div>
                      </div>
                      <div className="qr-scan-count">
                        {qr.scanNumber}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="stats-container">
        <div className="scan-count-container">
          <div className="scan-label">Всего</div>
          <div className="scan-number">{scanCount}</div>
          <div className="scan-subtitle">сканирований</div>
        </div>
        
        <div className="vertical-divider"></div>
        
        <button className="create-qr-btn" onClick={() => window.location.href='qr_shape_picker.html'}>
          <svg className="qr-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="btn-text">Создать QR</span>
        </button>
      </div>

      <div className="folder-section">
        <div className="folders-header" onClick={toggleFolders}>
          Ваши папки
          <span className="arrow-icon">{showFolders ? '▼' : '►'}</span>
        </div>
        
        {showFolders && (
          <div className="folders-content">
            <div className="create-folder-btn" onClick={handleCreateFolder}>
              <div className="create-folder-icon">+</div>
              <div>Создать папку</div>
            </div>
            
            {showNewFolderInput && (
              <div className="new-folder-input">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Название папки"
                  className="folder-input"
                  autoFocus
                />
                <button onClick={saveNewFolder} className="save-button">Сохранить</button>
              </div>
            )}
            
            <div className="folder-tree">
              {renderFolders()}
            </div>
          </div>
        )}
      </div>

      <div className="qr-section-title">Ваши QR-коды:</div>
      <div className="qr-list">
        {qrCodes
          .filter(qr => qr.folderId === null)
          .map((qr) => (
            <div key={qr.id} className="qr-card">
              <div className="qr-left">
                <img src={qr.imageUrl} alt="QR Code" />
                <div className="qr-info">
                  <strong>{qr.name}</strong>
                  <span>{qr.link.replace('https://', '')}</span>
                </div>
              </div>
              <div className="qr-scan-count-large">
                {qr.scanNumber}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default App;
