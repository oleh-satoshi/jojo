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

  const deleteFolder = (folderId) => {
    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    setFolders(updatedFolders);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    setActiveFolderMenu(null);
  };

  const renameFolder = (folderId, newName) => {
    const updatedFolders = folders.map(folder => 
      folder.id === folderId ? { ...folder, name: newName } : folder
    );
    setFolders(updatedFolders);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    setActiveFolderMenu(null);
  };

  const deleteFolderWithQRs = (folderId) => {
    // Delete folder and remove QR codes in that folder
    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    const updatedQRs = qrCodes.filter(qr => qr.folderId !== folderId);
    
    setFolders(updatedFolders);
    setQrCodes(updatedQRs);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    setActiveFolderMenu(null);
  };

  const renderFolders = (parentId = null, level = 0) => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .map(folder => {
        const hasChildren = folders.some(f => f.parentId === folder.id);
        const isExpanded = expandedFolders[folder.id];
        
        return (
          <div key={folder.id} className="folder-container" style={{ marginLeft: level > 0 ? `${level * 16}px` : '0' }}>
            <div 
              className={`folder-item ${level === 0 ? 'top-level' : ''}`} 
              onClick={() => hasChildren && toggleFolderExpansion(folder.id)}
            >
              {hasChildren && (
                <span className="folder-arrow">
                  {isExpanded ? '▼' : '►'}
                </span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="folder-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-9l-2-3H4.5A1.5 1.5 0 003 7.5z" />
              </svg>
              <span className="folder-name">{folder.name}</span>
              
              <div className="folder-menu-container">
                <button className="folder-menu-btn" onClick={(e) => toggleFolderMenu(folder.id, e)}>
                  ⋮
                </button>
                
                {activeFolderMenu === folder.id && (
                  <div className="folder-menu">
                    <div className="menu-item" onClick={() => {
                      const newName = prompt("Введите новое имя папки:", folder.name);
                      if (newName) renameFolder(folder.id, newName);
                    }}>
                      Переименовать
                    </div>
                    <div className="menu-item" onClick={() => deleteFolder(folder.id)}>
                      Удалить папку
                    </div>
                    <div className="menu-item" onClick={() => deleteFolderWithQRs(folder.id)}>
                      Удалить со всеми QR
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {hasChildren && isExpanded && renderFolders(folder.id, level + 1)}
            
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
                    <div className="qr-scan-badge">
                      {qr.scanNumber}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        );
      });
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
          <div className="plus-icon">+</div>
          <div className="create-text">
            создать<br />qr
          </div>
        </button>
      </div>

      <div className="folders-header" onClick={toggleFolders}>
        Ваши папки
        <span className="arrow-icon">{showFolders ? '▼' : '►'}</span>
      </div>
      
      {showFolders && (
        <div className="folders-container">
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
              />
              <button onClick={saveNewFolder} className="save-button">Сохранить</button>
            </div>
          )}
          
          {renderFolders()}
        </div>
      )}

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
              <div className="qr-scan-badge">
                {qr.scanNumber}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default App;
