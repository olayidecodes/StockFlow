import React from 'react';
import { useCountry } from '../context/CountryContext';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';

const CountrySelector = () => {
    const { activeCountry, availableCountries, setActiveCountry, loadingCountries } = useCountry();

    if (loadingCountries) return null;

    // Show a plain label when there's only one country (nothing to switch to)
    if (availableCountries.length <= 1) {
        if (!activeCountry) return null;
        return (
            <div style={styles.single}>
                <FiGlobe style={styles.icon} />
                <span style={styles.name}>{activeCountry.name}</span>
            </div>
        );
    }

    return (
        <div style={styles.wrapper}>
            <FiGlobe style={styles.icon} />
            <select
                value={activeCountry?._id || ''}
                onChange={(e) => {
                    const selected = availableCountries.find((c) => c._id === e.target.value);
                    if (selected) setActiveCountry(selected);
                }}
                style={styles.select}
                aria-label="Select active country"
            >
                {availableCountries.map((country) => (
                    <option key={country._id} value={country._id}>
                        {country.name}
                    </option>
                ))}
            </select>
            <FiChevronDown style={styles.chevron} />
        </div>
    );
};

const styles = {
    wrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: '#F0F4FF',
        border: '1px solid #D1DEFF',
        borderRadius: '8px',
        padding: '4px 10px 4px 8px',
        position: 'relative',
    },
    single: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: '#F0F4FF',
        border: '1px solid #D1DEFF',
        borderRadius: '8px',
        padding: '4px 10px 4px 8px',
        fontSize: '0.85rem',
        color: '#4880FF',
        fontWeight: 600,
    },
    icon: {
        color: '#4880FF',
        fontSize: '1rem',
        flexShrink: 0,
    },
    select: {
        border: 'none',
        background: 'transparent',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#4880FF',
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        paddingRight: '16px',
    },
    chevron: {
        color: '#4880FF',
        fontSize: '0.75rem',
        position: 'absolute',
        right: '6px',
        pointerEvents: 'none',
    },
    name: {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#4880FF',
    },
};

export default CountrySelector;
