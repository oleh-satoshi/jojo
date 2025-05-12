import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [telegramId, setTelegramId] = useState("user123"); // Default user ID
  const [totalScans, setTotalScans] = useState(0);
  const [showFolders, setShowFolders] = useState(false);
  const [folders, setFolders] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Get query parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTelegramId = params.get('telegramId');
    if (urlTelegramId) {
      setTelegramId(urlTelegramId);
      localStorage.setItem('telegramId', urlTelegramId);
    } else {
      const storedId = localStorage.getItem('telegramId');
      if (storedId) {
        setTelegramId(storedId);
      }
    }
  }, []);

  // Fetch total scans
  useEffect(() => {
    if (telegramId) {
      fetchTotalScans();
      fetchFolders();
      fetchQrCodes();
    }
  }, [telegramId]);

  const fetchTotalScans = async () => {
    try {
      const response = await axios.get(`${API}/total_scans/${telegramId}`);
      setTotalScans(response.data.total);
    } catch (error) {
      console.error("Error fetching total scans:", error);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await axios.get(`${API}/folders/${telegramId}`);
      setFolders(response.data);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const fetchQrCodes = async () => {
    try {
      const response = await axios.get(`${API}/qrcodes/${telegramId}`);
      setQrCodes(response.data);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    }
  };

  const toggleFolders = () => {
    setShowFolders(!showFolders);
  };

  const handleCreateFolder = () => {
    setShowNewFolderInput(true);
  };

  const saveNewFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await axios.post(`${API}/folders`, {
          name: newFolderName,
          user_id: telegramId
        });
        setNewFolderName("");
        setShowNewFolderInput(false);
        fetchFolders(); // Refresh folders list
      } catch (error) {
        console.error("Error creating folder:", error);
      }
    }
  };

  return (
    <div className="container">
      <div className="stat-wrapper">
        <div className="stat-left">
          <div className="stat-label">Всего</div>
          <div className="stat-count" id="scanCount">{totalScans}</div>
          <div className="stat-sub">Сканирований</div>
        </div>
        <div 
          className="stat-action" 
          onClick={() => window.location.href='qr_shape_picker.html'}>
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
          
          {folders.map((folder) => (
            <div key={folder.id} className="folder-item">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-9l-2-3H4.5A1.5 1.5 0 003 7.5z" />
              </svg>
              {folder.name}
            </div>
          ))}
        </div>
      )}

      <div className="qr-section-title">Ваши QR-коды:</div>
      <div id="qrList">
        {qrCodes.map((qr) => (
          <div key={qr.id} className="qr-card">
            <div className="qr-left">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr.link)}&size=100x100`} alt="QR Code" />
              <div className="qr-info">
                <strong>{qr.name}</strong>
                <span>{qr.link.replace('https://', '')}</span>
              </div>
            </div>
            <div className="qr-count">
              Сканирований: {qr.scan_count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
