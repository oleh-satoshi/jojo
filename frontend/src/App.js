import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [scanCount, setScanCount] = useState(0);
  const [showFolders, setShowFolders] = useState(true);
  const [folders, setFolders] = useState([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [parentFolderForNew, setParentFolderForNew] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [qrCodes, setQrCodes] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [activeFolderMenu, setActiveFolderMenu] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [selectedQR, setSelectedQR] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [showNotification, setShowNotification] = useState(true);

  const modalRef = useRef(null);
  const newFolderInputRef = useRef(null);

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
        name: "Рабочие QR с очень длинным названием для тестирования",
        level: 0,
        parentId: null,
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
      },
      {
        id: "5",
        name: "Важные",
        level: 2,
        parentId: "4",
      }
    ];
    
    setFolders(sampleFolders);
    
    // Автоматически раскрываем все папки для демонстрации
    const expandedState = {};
    sampleFolders.forEach(folder => {
      expandedState[folder.id] = true;
    });
    setExpandedFolders(expandedState);

    localStorage.setItem('folders', JSON.stringify(sampleFolders));
    
    // Sample QR code data for demonstration
    setQrCodes([
      {
        id: "1",
        name: "Get Free Coffee at Starbucks with Very Long Name for Testing Overflow",
        link: "https://example.com/starbucks/promotion/winter/coffee/free",
        scanNumber: 42,
        folderId: "5",
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
    ]);

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
    if (e) e.stopPropagation();
    setActiveFolderMenu(activeFolderMenu === folderId ? null : folderId);
  };

  const handleCreateFolder = (parentId = null) => {
    setParentFolderForNew(parentId);
    setShowNewFolderInput(true);
    setNewFolderName("");
  };

  const saveNewFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        level: parentFolderForNew ? 
               folders.find(f => f.id === parentFolderForNew)?.level + 1 : 0,
        parentId: parentFolderForNew
      };
      
      const newFolders = [...folders, newFolder];
      setFolders(newFolders);
      localStorage.setItem('folders', JSON.stringify(newFolders));
      setNewFolderName("");
      setShowNewFolderInput(false);
      setParentFolderForNew(null);
      
      // Автоматически раскрываем родительскую папку
      if (parentFolderForNew) {
        setExpandedFolders(prev => ({
          ...prev,
          [parentFolderForNew]: true
        }));
      }
    }
  };

  const startDeleteFolder = (folderId, withQRs, e) => {
    if (e) e.stopPropagation();
    setShowDeleteConfirm(folderId);
    setDeleteType(withQRs ? "withQRs" : "folderOnly");
    setActiveFolderMenu(null);
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
    } else {
      // Удалить только папку, QR-коды перенести в корень
      const updatedFolders = folders.filter(folder => folder.id !== folderId);
      const updatedQRs = qrCodes.map(qr => 
        qr.folderId === folderId ? {...qr, folderId: null} : qr
      );
      
      setFolders(updatedFolders);
      setQrCodes(updatedQRs);
      localStorage.setItem('folders', JSON.stringify(updatedFolders));
    }
    
    setShowDeleteConfirm(null);
    setDeleteType("");
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

  const createQRInFolder = (folderId, e) => {
    if (e) e.stopPropagation();
    // Redirect to QR creation page with folder ID
    window.location.href = `qr_shape_picker.html?folderId=${folderId}`;
  };

  const handleQRClick = (qr) => {
    setSelectedQR(qr);
  };

  const updateQR = (updates) => {
    const updatedQRs = qrCodes.map(qr => 
      qr.id === selectedQR.id ? {...qr, ...updates} : qr
    );
    
    setQrCodes(updatedQRs);
    setSelectedQR(prev => prev ? {...prev, ...updates} : null);
  };

  const resetScanCount = () => {
    updateQR({scanNumber: 0});
  };

  const dismissNotification = () => {
    setShowNotification(false);
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
          
          // Проверяем есть ли QR-коды в этой папке
          const hasQRs = qrCodes.some(qr => qr.folderId === folder.id);
          
          return (
            <div key={folder.id} className={`folder-branch ${isLastInLevel && !hasChildren ? 'last-branch' : ''}`}>
              <div 
                className="folder-item"
                onClick={() => toggleFolderExpansion(folder.id)}
              >
                <div className="folder-expand-indicator">
                  {hasChildren && (
                    <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                      {isExpanded ? '▼' : '►'}
                    </span>
                  )}
                </div>
                
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
                    title="Добавить QR в эту папку"
                  >
                    <span className="add-qr-plus">+</span> Добавить QR
                  </button>
                  
                  <button 
                    className="add-subfolder-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFolder(folder.id);
                    }}
                    title="Создать подпапку"
                  >
                    <span className="folder-plus">+</span>
                  </button>
                  
                  <button 
                    className="folder-menu-btn" 
                    onClick={(e) => toggleFolderMenu(folder.id, e)}
                    title="Меню папки"
                  >
                    ⋯
                  </button>
                  
                  {activeFolderMenu === folder.id && (
                    <div className="folder-menu" onClick={(e) => e.stopPropagation()}>
                      <div className="menu-item" onClick={(e) => startRenameFolder(folder.id, folder.name, e)}>
                        Переименовать
                      </div>
                      <div className="menu-item" onClick={(e) => startDeleteFolder(folder.id, false, e)}>
                        Удалить папку
                      </div>
                      <div className="menu-item" onClick={(e) => startDeleteFolder(folder.id, true, e)}>
                        Удалить со всеми QR
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* QR-коды в этой папке, если она раскрыта */}
              {isExpanded && qrCodes
                .filter(qr => qr.folderId === folder.id)
                .map(qr => (
                  <div key={qr.id} className="qr-in-folder">
                    <div className="qr-card" onClick={() => handleQRClick(qr)}>
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
                      <div className="qr-click-indicator">⊕</div>
                    </div>
                  </div>
                ))}
              
              {/* Подпапки */}
              {hasChildren && isExpanded && (
                <div className="subfolder-container">
                  {renderFolders(folder.id, level + 1)}
                </div>
              )}
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
            <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path fillRule="evenodd" clipRule="evenodd" d="M14 20H20V14H14V20Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 7L7 7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 7L17 7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7 17L7 17.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 17L17 17.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="btn-text">Создать QR</span>
        </button>
      </div>

      <div className="folder-section">
        {showNotification && (
          <div className="notification">
            <div className="notification-content">
              <strong>Совет:</strong> Нажмите на QR-код для настройки или на папку для просмотра содержимого
            </div>
            <button className="notification-close" onClick={dismissNotification}>✕</button>
          </div>
        )}
      
        <div className="folders-header">
          <div className="folders-header-title" onClick={toggleFolders}>
            Ваши папки
            <span className="arrow-icon">{showFolders ? '▼' : '►'}</span>
          </div>
          <button 
            className="create-root-folder-btn"
            onClick={() => handleCreateFolder()}
            title="Создать новую папку"
          >
            <span className="folder-plus">+</span> Создать папку
          </button>
        </div>
        
        {showFolders && (
          <div className="folders-content">
            {showNewFolderInput && (
              <div className="new-folder-input">
                <input
                  ref={newFolderInputRef}
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Название папки"
                  className="folder-input"
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
            <div key={qr.id} className="qr-card" onClick={() => handleQRClick(qr)}>
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
              <div className="qr-click-indicator">⊕</div>
            </div>
          ))}
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
                <p>Вы действительно хотите удалить папку? Все QR-коды будут перемещены в раздел «Ваши QR-коды».</p>
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
  );
}

export default App;
