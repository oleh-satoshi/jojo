import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [scanCount, setScanCount] = useState(0);
  const [showFolders, setShowFolders] = useState(false);
  const [folders, setFolders] = useState([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [qrCodes, setQrCodes] = useState([]);

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
    
    // Load folders from localStorage
    const storedFolders = JSON.parse(localStorage.getItem('folders') || '[]');
    setFolders(storedFolders);
    
    // Sample QR code data for demonstration
    setQrCodes([
      {
        id: "1",
        name: "Get Free Coffee",
        link: "https://example.com/starbucks",
        scanNumber: 42,
        imageUrl: "https://api.qrserver.com/v1/create-qr-code/?data=coffee"
      }
    ]);
  }, []);

  const toggleFolders = () => {
    setShowFolders(!showFolders);
  };

  const handleCreateFolder = () => {
    setShowNewFolderInput(true);
  };

  const saveNewFolder = () => {
    if (newFolderName.trim()) {
      const newFolders = [...folders, { id: Date.now().toString(), name: newFolderName }];
      setFolders(newFolders);
      localStorage.setItem('folders', JSON.stringify(newFolders));
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };

  return (
    <div className="container">
      <div className="stat-wrapper">
        <div className="stat-left">
          <div className="stat-label">Всего</div>
          <div className="stat-count" id="scanCount">{scanCount}</div>
          <div className="stat-sub">Сканирований</div>
        </div>
        <div className="stat-action" onClick={() => window.location.href='qr_shape_picker.html'}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Создать QR
        </div>
      </div>

      <div className="section-header" onClick={toggleFolders}>
        Ваши папки:
        <span>{showFolders ? '▼' : '►'}</span>
      </div>
      
      {showFolders && (
        <div className="folder-tree" id="folderTree">
          <div className="folder-item create-folder" onClick={handleCreateFolder}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Создать папку
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
          
          {folders.map((folder, index) => (
            <div key={folder.id} className="folder-item">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-9l-2-3H4.5A1.5 1.5 0 003 7.5z" />
              </svg>
              {folder.name}
              
              {/* Display QR code in folder if it's the last folder (for demo) */}
              {index === folders.length - 1 && qrCodes.length > 0 && (
                <div className="qr-in-folder">
                  <div className="qr-card">
                    <div className="qr-left">
                      <img src={qrCodes[0].imageUrl} alt="QR Code" />
                      <div className="qr-info">
                        <strong>{qrCodes[0].name}</strong>
                        <span>{qrCodes[0].link.replace('https://', '')}</span>
                      </div>
                    </div>
                    <div className="qr-count">Сканирований: {qrCodes[0].scanNumber}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="qr-section-title">Ваши QR-коды:</div>
      <div id="qrList">
        {qrCodes.map((qr) => (
          <div key={qr.id} className="qr-card">
            <div className="qr-left">
              <img src={qr.imageUrl} alt="QR Code" />
              <div className="qr-info">
                <strong>{qr.name}</strong>
                <span>{qr.link.replace('https://', '')}</span>
              </div>
            </div>
            <div className="qr-count">Сканирований: {qr.scanNumber}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
