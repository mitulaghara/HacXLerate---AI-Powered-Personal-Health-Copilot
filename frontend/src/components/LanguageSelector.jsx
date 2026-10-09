import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import styled from 'styled-components';
import { LANGUAGES, changeApplicationLanguage } from '../utils/languageHelper';

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.05);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  transition: all 0.2s;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  color: #0b6b68;
  
  &:hover {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.4);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #ffffff;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 8px;
  min-width: 160px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.$isOpen ? '0' : '-10px'});
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
`;

const DropdownItem = styled.button`
  background: ${props => props.$isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent'};
  color: ${props => props.$isActive ? '#0b6b68' : 'var(--text-main, #334155)'};
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  text-align: left;
  font-size: 0.85rem;
  font-family: var(--font-body);
  font-weight: ${props => props.$isActive ? '600' : '500'};
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: rgba(16, 185, 129, 0.05);
    color: #0b6b68;
  }
`;

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const currentLangCode = (i18n.language || 'en').split('-')[0];
  const currentLangObj = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    changeApplicationLanguage(code);
    setIsOpen(false);
  };

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton onClick={() => setIsOpen(!isOpen)}>
        <Globe size={16} color="#10b981" />
        {currentLangObj.native}
        <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </DropdownButton>
      
      <DropdownMenu $isOpen={isOpen}>
        {LANGUAGES.map(lang => (
          <DropdownItem 
            key={lang.code} 
            $isActive={currentLangCode === lang.code}
            onClick={() => handleSelect(lang.code)}
          >
            <span>{lang.native}</span>
            {lang.native !== lang.label && (
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{lang.label}</span>
            )}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </DropdownContainer>
  );
}
