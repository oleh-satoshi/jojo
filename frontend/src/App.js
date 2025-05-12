import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [scanCount, setScanCount] = useState(0);
  const [folders, setFolders] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null); // null означает корневую директорию
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedQR, setSelectedQR] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [showNotification, setShowNotification] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const modalRef = useRef(null);
  const newFolderInputRef = useRef(null);

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
          name: "Рабочие QR с очень длинным названием для тестирования",
          parentId: null,
        },
        {
          id: "3",
          name: "Клиенты",
          parentId: "2",
        },
        {
          id: "4",
          name: "Встречи",
          parentId: "2",
        },
        {
          id: "5",
          name: "Важные",
          parentId: "4",
        }
      ];
      
      localStorage.setItem('folders', JSON.stringify(storedFolders));
    }
    
    setFolders(storedFolders);
    
    // Если в URL передан ID папки, открываем её
    if (folderId) {
      openFolder(folderId);
    }
    
    // Load QR codes from localStorage or use sample data if none exists
    let storedQRs = JSON.parse(localStorage.getItem('qr_codes') || '[]');
    
    if (storedQRs.length === 0) {
      // Sample QR code data for demonstration
      storedQRs = [
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

  // Обновляем хлебные крошки при смене текущей папки
  useEffect(() => {
    if (currentFolder === null) {
      setBreadcrumbs([]);
      return;
    }
    
    const buildBreadcrumbs = () => {
      const result = [];
      let current = folders.find(f => f.id === currentFolder);
      
      while (current) {
        result.unshift({
          id: current.id,
          name: current.name
        });
        
        current = folders.find(f => f.id === current.parentId);
      }
      
      return result;
    };
    
    setBreadcrumbs(buildBreadcrumbs());
  }, [currentFolder, folders]);

  const openFolder = (folderId) => {
    setCurrentFolder(folderId);
  };

  const goBack = () => {
    if (breadcrumbs.length <= 1) {
      setCurrentFolder(null);
    } else {
      const parentId = folders.find(f => f.id === currentFolder)?.parentId;
      setCurrentFolder(parentId);
    }
  };

  const goToFolder = (folderId) => {
    setCurrentFolder(folderId);
  };

  const handleCreateFolder = () => {
    setShowNewFolderInput(true);
    setNewFolderName("");
  };

  const saveNewFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        parentId: currentFolder
      };
      
      const newFolders = [...folders, newFolder];
      setFolders(newFolders);
      localStorage.setItem('folders', JSON.stringify(newFolders));
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
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
    
    // Если мы удалили текущую папку, возвращаемся назад
    if (folderId === currentFolder) {
      goBack();
    }
    
    setShowDeleteConfirm(null);
    setDeleteType("");
  };

  const renameFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    const newName = prompt("Введите новое название папки:", folder.name);
    
    if (newName && newName.trim()) {
      const updatedFolders = folders.map(folder => 
        folder.id === folderId ? { ...folder, name: newName.trim() } : folder
      );
      setFolders(updatedFolders);
      localStorage.setItem('folders', JSON.stringify(updatedFolders));
    }
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

  const dismissNotification = () => {
    setShowNotification(false);
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
        
        <button className="create-qr-btn" onClick={() => createQRInFolder(currentFolder)}>
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

      {showNotification && (
        <div className="notification">
          <div className="notification-content">
            <strong>Совет:</strong> Нажмите на QR-код для настройки или на папку для просмотра содержимого
          </div>
          <button className="notification-close" onClick={dismissNotification}>✕</button>
        </div>
      )}

      {/* Navigation */}
      <div className="folder-navigation">
        {currentFolder !== null && (
          <div className="folder-navigation-header">
            <button className="back-button" onClick={goBack}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Назад
            </button>
            
            <div className="breadcrumbs">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  {index > 0 && <span className="breadcrumb-separator">/</span>}
                  <span className="breadcrumb">{crumb.name}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Folder content area */}
      <div className="folder-section">
        <div className="section-header">
          <h2>{currentFolder ? folders.find(f => f.id === currentFolder)?.name : "Ваши папки"}</h2>
          <button 
            className="create-folder-btn"
            onClick={handleCreateFolder}
            title="Создать новую папку"
          >
            <span className="folder-plus">+</span> Создать папку
          </button>
        </div>

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

        <div className="folder-content">
          {folders
            .filter(folder => folder.parentId === currentFolder)
            .map(folder => (
              <div key={folder.id} className="folder-item" onClick={() => openFolder(folder.id)}>
                <div className="folder-icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="folder-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-9l-2-3H4.5A1.5 1.5 0 003 7.5z" />
                  </svg>
                </div>
                <span className="folder-name">{folder.name}</span>
                <div className="folder-actions">
                  <button
                    className="folder-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      renameFolder(folder.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="action-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    className="folder-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startDeleteFolder(folder.id, false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="action-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* QR codes section */}
      <div className="qr-section">
        <div className="section-header">
          <h2>QR-коды {currentFolder ? "в этой папке" : ""}</h2>
          {currentFolder && (
            <button 
              className="add-qr-to-folder-btn" 
              onClick={() => createQRInFolder(currentFolder)}
              title="Добавить QR в эту папку"
            >
              <span className="add-qr-plus">+</span> Добавить QR
            </button>
          )}
        </div>

        <div className="qr-list">
          {qrCodes
            .filter(qr => qr.folderId === currentFolder)
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
