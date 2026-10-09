import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import styled from 'styled-components';
import { LANGUAGES, changeApplicationLanguage } from '../utils/languageHelper';

const LangWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const Select = styled.select`
  appearance: none;
  background: transparent;
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 6px 30px 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-main, #0f172a);
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  
  &:hover {
    border-color: #10b981;
  }
  
  &:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: #10b981;
`;

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en').split('-')[0];

  const handleLanguageChange = (e) => {
    const selected = e.target.value;
    changeApplicationLanguage(selected);
  };

  return (
    <LangWrapper>
      <Globe size={16} color="#10b981" />
      <Select value={currentLang} onChange={handleLanguageChange}>
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.native} {lang.native !== lang.label ? `(${lang.label})` : ''}
          </option>
        ))}
      </Select>
      <IconWrapper>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </IconWrapper>
    </LangWrapper>
  );
}
