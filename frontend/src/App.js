import React, { useState, useEffect } from "react";
import "./App.css";
import confetti from 'canvas-confetti';

function App() {
  const [scanCount, setScanCount] = useState(0);
  const [currentPage, setCurrentPage] = useState("home"); // home, folder, createQR
  const [folders, setFolders] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedQR, setSelectedQR] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [showFolders, setShowFolders] = useState(false);
  
  // Форма для создания QR
  const [qrName, setQrName] = useState("");
  const [qrLink, setQrLink] = useState("");
  const [qrDescription, setQrDescription] = useState("");
  const [qrCreated, setQrCreated] = useState(false);
  const [qrStyle, setQrStyle] = useState("black_square");

  // Get query parameters from URL and load data
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
    
    // Load QR codes from localStorage
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
  }, []);

  // Функции для работы с папками
  const handleCreateFolder = () => {
    setShowNewFolderInput(true);
    setNewFolderName("");
  };

  const saveNewFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        parentId: null
      };
      
      const newFolders = [...folders, newFolder];
      setFolders(newFolders);
      localStorage.setItem('folders', JSON.stringify(newFolders));
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };

  const openFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setActiveFolder(folder);
      setCurrentPage("folder");
    }
  };

  const goBack = () => {
    setActiveFolder(null);
    setCurrentPage("home");
  };

  const deleteFolder = (folderId, withQRs) => {
    if (withQRs) {
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
  };

  // Функции для работы с QR-кодами
  const navigateToCreateQR = () => {
    setCurrentPage("createQR");
    setQrName("");
    setQrLink("");
    setQrDescription("");
    setQrCreated(false);
  };

  const createQRCode = () => {
    if (!qrName.trim() || !qrLink.trim()) return;

    // Эффект конфетти
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Запуск конфетти с разных позиций
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Создание QR-кода
    const newQR = {
      id: Date.now().toString(),
      name: qrName,
      link: qrLink,
      description: qrDescription,
      folderId: activeFolder ? activeFolder.id : null,
      scanNumber: 0,
      active: true,
      imageUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrLink)}&size=200x200`,
      style: qrStyle
    };

    const updatedQRs = [...qrCodes, newQR];
    setQrCodes(updatedQRs);
    localStorage.setItem('qr_codes', JSON.stringify(updatedQRs));
    
    setQrCreated(true);
  };

  const addQRToFolder = () => {
    if (activeFolder) {
      navigateToCreateQR();
    }
  };

  // Выбор стиля QR-кода
  const qrStyles = [
    {
      id: "black_square",
      name: "Black Cube",
      description: "Эталон строгости — подчёркивает статус и минимализм."
    },
    {
      id: "white_square",
      name: "White Prism",
      description: "Светлая чистота, которая бросается в глаза."
    }
  ];

  // Отображение домашней страницы
  const renderHome = () => (
    <>
      <div className="stat-wrapper">
        <div className="stat-left">
          <div className="stat-label">Всего</div>
          <div className="stat-count" id="scanCount">{scanCount}</div>
          <div className="stat-sub">сканирований</div>
        </div>
        <div className="stat-action" onClick={navigateToCreateQR}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Создать QR
        </div>
      </div>

      <div className="section-header" onClick={() => setShowFolders(!showFolders)}>
        Ваши папки:
        <span>{showFolders ? '▼' : '►'}</span>
      </div>
      
      {showFolders && (
        <div className="folder-tree">
          {folders.map(folder => (
            <div key={folder.id} className="folder-item" onClick={() => openFolder(folder.id)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-9l-2-3H4.5A1.5 1.5 0 003 7.5z" />
              </svg>
              {folder.name}
            </div>
          ))}
          
          <div className="folder-item create-folder" onClick={handleCreateFolder}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Создать папку
          </div>
        </div>
      )}

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

      <div className="qr-section-title">Ваши QR-коды:</div>
      <div id="qrList">
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
              <div className="qr-count">Сканирований: {qr.scanNumber}</div>
            </div>
          ))}
      </div>
    </>
  );

  // Отображение содержимого папки
  const renderFolder = () => (
    <>
      <div className="folder-navigation">
        <button className="back-button" onClick={goBack}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </button>
        <div className="folder-title">{activeFolder.name}</div>
        <button className="create-folder-button" onClick={handleCreateFolder}>
          + Создать папку
        </button>
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

      <div className="qr-section-header">
        <div className="qr-section-title">QR-коды в этой папке</div>
        <button className="add-qr-button" onClick={addQRToFolder}>
          + Добавить QR
        </button>
      </div>

      <div id="qrList">
        {qrCodes
          .filter(qr => qr.folderId === activeFolder.id)
          .map((qr) => (
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
    </>
  );

  // Страница создания QR-кода
  const renderCreateQR = () => (
    <div className="create-qr-container">
      {qrCreated ? (
        <div className="success-container">
          <h2>QR-код успешно создан!</h2>
          <div className="created-qr-preview">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrLink)}&size=200x200`} alt="Created QR" />
          </div>
          <button className="return-button" onClick={goBack}>
            Вернуться к QR-кодам
          </button>
        </div>
      ) : (
        <>
          <h1>Создание QR-кода</h1>
          
          <div className="form-container">
            <div className="form-group">
              <label htmlFor="qrName">Название QR-кода</label>
              <input 
                type="text" 
                id="qrName" 
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="qrLink">Ссылка</label>
              <input 
                type="text" 
                id="qrLink" 
                value={qrLink}
                onChange={(e) => setQrLink(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="qrDescription">Описание (необязательно)</label>
              <input 
                type="text" 
                id="qrDescription" 
                value={qrDescription}
                onChange={(e) => setQrDescription(e.target.value)}
              />
            </div>
            
            <h3>Выберите стиль QR-кода:</h3>
            <div className="qr-style-grid">
              {qrStyles.map(style => (
                <div 
                  key={style.id}
                  className={`qr-style-card ${qrStyle === style.id ? 'selected' : ''}`}
                  onClick={() => setQrStyle(style.id)}
                >
                  <div className="style-preview">
                    <div className={`qr-preview ${style.id}`}></div>
                  </div>
                  <div className="style-name">{style.name}</div>
                  <div className="style-description">{style.description}</div>
                </div>
              ))}
            </div>
            
            <button 
              className="create-button" 
              onClick={createQRCode}
              disabled={!qrName.trim() || !qrLink.trim()}
            >
              Создать QR-код
            </button>
          </div>
          
          <button className="cancel-button" onClick={goBack}>
            Отмена
          </button>
        </>
      )}
    </div>
  );

  // Основной рендер
  return (
    <div className="container">
      {currentPage === "home" && renderHome()}
      {currentPage === "folder" && renderFolder()}
      {currentPage === "createQR" && renderCreateQR()}
    </div>
  );
}

export default App;
