import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [scanCount, setScanCount] = useState(0);
  const [folders, setFolders] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [selectedQR, setSelectedQR] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteType, setDeleteType] = useState("");

  const modalRef = useRef(null);
  const newFolderInputRef = useRef(null);
  const editFolderInputRef = useRef(null);

  // Get query parameters from URL and load data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const telegramId = params.get('telegramId');
    const totalScans = params.get('totalScans') || 0;
    const folderId = params.get('folderId');
    
    if (telegramId) {
      localStorage.setItem('telegramId', telegramId);
    }
    
    if (totalScans) {
      localStorage.setItem('totalScans', totalScans);
      setScanCount(Number(totalScans));
    } else {
      setScanCount(Number(localStorage.getItem('totalScans') || 0));
    }
    
    // Load folders from localStorage or use default sample data if none exists
    let storedFolders = JSON.parse(localStorage.getItem('folders') || '[]');
    
    if (storedFolders.length === 0) {
      // Sample folder structure
      storedFolders = [
        {
          id: "1",
          name: "Личные QR",
          parentId: null,
        },
        {
          id: "2",
          name: "Рабочие QR",
          parentId: null,
        }
      ];
      
      localStorage.setItem('folders', JSON.stringify(storedFolders));
    }
    
    setFolders(storedFolders);
    
    // Если в URL передан ID папки, открываем её
    if (folderId) {
      setActiveFolder(folderId);
    }
    
    // Load QR codes from localStorage or use sample data if none exists
    let storedQRs = JSON.parse(localStorage.getItem('qr_codes') || '[]');
    
    if (storedQRs.length === 0) {
      // Sample QR code data for demonstration
      storedQRs = [
        {
          id: "1",
          name: "Get Free Coffee at Starbucks",
          link: "https://example.com/starbucks",
          scanNumber: 42,
          folderId: "1",
          active: true,
          imageUrl: "https://api.qrserver.com/v1/create-qr-code/?data=coffee"
        },
        {
          id: "2",
          name: "Website QR",
          link: "https://example.com",
          scanNumber: 23,
          folderId: null,
          active: true,
          imageUrl: "https://api.qrserver.com/v1/create-qr-code/?data=example"
        }
      ];
      
      localStorage.setItem('qr_codes', JSON.stringify(storedQRs));
    }
    
    setQrCodes(storedQRs);

    // Закрываем модальное окно при клике вне его
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setSelectedQR(null);
        setShowDeleteConfirm(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Автофокус на поле ввода при его появлении
  useEffect(() => {
    if (showNewFolderInput && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [showNewFolderInput]);

  useEffect(() => {
    if (editingFolder !== null && editFolderInputRef.current) {
      editFolderInputRef.current.focus();
    }
  }, [editingFolder]);

  const handleCreateFolder = () => {
    setShowNewFolderInput(true);
    setNewFolderName("");
  };

  const saveNewFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        parentId: activeFolder
      };
      
      const newFolders = [...folders, newFolder];
      setFolders(newFolders);
      localStorage.setItem('folders', JSON.stringify(newFolders));
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };

  const startEditFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setEditingFolder(folderId);
      setEditingFolderName(folder.name);
    }
  };

  const saveEditFolder = () => {
    if (editingFolderName.trim() && editingFolder) {
      const updatedFolders = folders.map(folder => 
        folder.id === editingFolder ? { ...folder, name: editingFolderName } : folder
      );
      
      setFolders(updatedFolders);
      localStorage.setItem('folders', JSON.stringify(updatedFolders));
      setEditingFolder(null);
      setEditingFolderName("");
    }
  };

  const cancelEditFolder = () => {
    setEditingFolder(null);
    setEditingFolderName("");
  };

  const startDeleteFolder = (folderId, withQRs) => {
    setShowDeleteConfirm(folderId);
    setDeleteType(withQRs ? "withQRs" : "folderOnly");
  };

  const confirmDeleteFolder = () => {
    const folderId = showDeleteConfirm;
    
    if (deleteType === "withQRs") {
      // Удалить папку и все QR-коды в ней
      const updatedFolders = folders.filter(folder => folder.id !== folderId);
      const updatedQRs = qrCodes.filter(qr => qr.folderId !== folderId);
      
      setFolders(updatedFolders);
      setQrCodes(updatedQRs);
      localStorage.setItem('folders', JSON.stringify(updatedFolders));
      localStorage.setItem('qr_codes', JSON.stringify(updatedQRs));
    } else {
      // Удалить только папку, QR-коды перенести в корень
      const updatedFolders = folders.filter(folder => folder.id !== folderId);
      const updatedQRs = qrCodes.map(qr => 
        qr.folderId === folderId ? {...qr, folderId: null} : qr
      );
      
      setFolders(updatedFolders);
      setQrCodes(updatedQRs);
      localStorage.setItem('folders', JSON.stringify(updatedFolders));
      localStorage.setItem('qr_codes', JSON.stringify(updatedQRs));
    }
    
    // Если мы удалили активную папку, закрываем её
    if (folderId === activeFolder) {
      setActiveFolder(null);
    }
    
    setShowDeleteConfirm(null);
    setDeleteType("");
  };

  const goBack = () => {
    setActiveFolder(null);
  };

  const createQRInFolder = (folderId) => {
    window.location.href = `qr_shape_picker.html?folderId=${folderId || ''}`;
  };

  const handleQRClick = (qr) => {
    setSelectedQR(qr);
  };

  const updateQR = (updates) => {
    const updatedQRs = qrCodes.map(qr => 
      qr.id === selectedQR.id ? {...qr, ...updates} : qr
    );
    
    setQrCodes(updatedQRs);
    localStorage.setItem('qr_codes', JSON.stringify(updatedQRs));
    setSelectedQR(prev => prev ? {...prev, ...updates} : null);
  };

  const resetScanCount = () => {
    updateQR({scanNumber: 0});
  };

  // Функция для получения QR-кодов текущей папки
  const getCurrentFolderQRs = () => {
    return qrCodes.filter(qr => qr.folderId === activeFolder);
  };

  // Функция для получения имени текущей папки
  const getCurrentFolderName = () => {
    if (!activeFolder) return "QR-коды";
    const folder = folders.find(f => f.id === activeFolder);
    return folder ? folder.name : "QR-коды";
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="header-section">
          <div className="scan-counter">
            <div className="counter-label">Всего</div>
            <div className="counter-value">{scanCount}</div>
            <div className="counter-label">сканирований</div>
          </div>
          
          <button className="create-qr-button" onClick={() => createQRInFolder(activeFolder)}>
            <div className="qr-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path fillRule="evenodd" clipRule="evenodd" d="M14 20H20V14H14V20Z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="button-text">Создать QR</div>
          </button>
        </div>

        <div className="navigation-section">
          {activeFolder ? (
            <button className="back-button" onClick={goBack}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Назад
            </button>
          ) : null}
          <div className="current-folder-name">{getCurrentFolderName()}</div>
          <button className="create-folder-button" onClick={handleCreateFolder}>
            + Создать папку
          </button>
        </div>

        {showNewFolderInput && (
          <div className="folder-input-container">
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Название папки"
              className="folder-input"
            />
            <button onClick={saveNewFolder} className="save-button">
              Сохранить
            </button>
          </div>
        )}

        {editingFolder !== null && (
          <div className="folder-input-container">
            <input
              ref={editFolderInputRef}
              type="text"
              value={editingFolderName}
              onChange={(e) => setEditingFolderName(e.target.value)}
              placeholder="Название папки"
              className="folder-input"
            />
            <div className="edit-buttons">
              <button onClick={cancelEditFolder} className="cancel-button">
                Отмена
              </button>
              <button onClick={saveEditFolder} className="save-button">
                Сохранить
              </button>
            </div>
          </div>
        )}

        {!activeFolder && (
          <div className="folders-list">
            {folders
              .filter(folder => folder.parentId === null)
              .map(folder => (
                <div key={folder.id} className="folder-item" onClick={() => setActiveFolder(folder.id)}>
                  <div className="folder-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-9l-2-3H4.5A1.5 1.5 0 003 7.5z" />
                    </svg>
                  </div>
                  <div className="folder-name">{folder.name}</div>
                  <div className="folder-actions">
                    <button className="folder-action-btn" onClick={(e) => {
                      e.stopPropagation();
                      startEditFolder(folder.id);
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button className="folder-action-btn" onClick={(e) => {
                      e.stopPropagation();
                      startDeleteFolder(folder.id, false);
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="qr-section">
          <div className="qr-section-header">
            <h2>QR-коды в этой папке</h2>
            {activeFolder && (
              <button className="add-qr-button" onClick={() => createQRInFolder(activeFolder)}>
                + Добавить QR
              </button>
            )}
          </div>

          <div className="qr-list">
            {qrCodes
              .filter(qr => qr.folderId === activeFolder)
              .map((qr) => (
                <div key={qr.id} className="qr-card" onClick={() => handleQRClick(qr)}>
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
              ))}
          </div>
        </div>

        {/* Модальное окно для QR-кода */}
        {selectedQR && (
          <div className="modal-overlay">
            <div className="modal-content" ref={modalRef}>
              <div className="modal-header">
                <h3>Настройки QR-кода</h3>
                <button className="modal-close" onClick={() => setSelectedQR(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="qr-preview">
                  <img src={selectedQR.imageUrl} alt="QR Preview" className="qr-preview-img" />
                </div>
                
                <div className="qr-settings">
                  <div className="setting-group">
                    <label>Название</label>
                    <input 
                      type="text" 
                      className="modal-input" 
                      value={selectedQR.name}
                      onChange={(e) => updateQR({name: e.target.value})}
                    />
                  </div>
                  
                  <div className="setting-group">
                    <label>Ссылка</label>
                    <input 
                      type="text" 
                      className="modal-input" 
                      value={selectedQR.link}
                      onChange={(e) => updateQR({link: e.target.value})}
                    />
                  </div>
                  
                  <div className="setting-group">
                    <label>Активность</label>
                    <div className="toggle-container">
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={selectedQR.active}
                          onChange={(e) => updateQR({active: e.target.checked})}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span>{selectedQR.active ? 'Активен' : 'Отключен'}</span>
                    </div>
                  </div>
                  
                  <div className="setting-group">
                    <label>Количество сканирований: {selectedQR.scanNumber}</label>
                    <button className="reset-scans-btn" onClick={resetScanCount}>
                      Обнулить счетчик
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="download-options">
                  <label>Скачать QR-код:</label>
                  <div className="download-buttons">
                    <button className="download-btn">PNG</button>
                    <button className="download-btn">SVG</button>
                    <button className="download-btn">PDF</button>
                  </div>
                </div>
                <button className="save-qr-btn" onClick={() => setSelectedQR(null)}>
                  Сохранить и закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно подтверждения удаления */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content delete-confirm-modal" ref={modalRef}>
              <div className="modal-header">
                <h3>Подтверждение удаления</h3>
                <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>✕</button>
              </div>
              <div className="modal-body">
                {deleteType === "folderOnly" ? (
                  <p>Вы действительно хотите удалить папку? Все QR-коды будут перемещены в раздел «QR-коды».</p>
                ) : (
                  <p>Вы действительно хотите удалить папку со всеми QR-кодами? Это действие нельзя отменить.</p>
                )}
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowDeleteConfirm(null)}>
                  Отмена
                </button>
                <button className="confirm-delete-btn" onClick={confirmDeleteFolder}>
                  Да, удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
