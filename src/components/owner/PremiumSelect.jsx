import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './PremiumSelect.css';

const PremiumSelect = ({ options, value, onChange, placeholder = 'Sélectionner', icon: Icon, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value) || null;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { name: label, value: optionValue } }); // Mimic standard event for compatibility
        setIsOpen(false);
    };

    return (
        <div className="premium-select-container" ref={dropdownRef}>
            {label && <label className="premium-select-label">{label}</label>}
            <div
                className={`premium-select-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="trigger-content">
                    {Icon && <Icon className="trigger-icon" size={18} />}
                    <span className={`selected-text ${!selectedOption ? 'placeholder' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`chevron-icon ${isOpen ? 'rotate' : ''}`} size={18} />
            </div>

            {isOpen && (
                <div className="premium-select-dropdown animate-pop-in">
                    <div className="dropdown-scroll-area">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className={`dropdown-option ${value === option.value ? 'selected' : ''}`}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span className="option-label">{option.label}</span>
                                {value === option.value && <Check size={16} className="check-icon" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumSelect;
