import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {FORM, formStyles} from './formStyles';

const SearchableDropdown = ({
  data = [],
  placeholder,
  value,
  onSelect,
  label,
  icon = 'location-outline',
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(data);
  const containerRef = useRef(null);

  useEffect(() => {
    setSearchText(value || '');
  }, [value]);

  useEffect(() => {
    setFilteredData(data || []);
  }, [data]);

  const handleSearch = text => {
    setSearchText(text);
    if (!isOpen) {
      setIsOpen(true);
    }
    const filtered = (data || []).filter(item =>
      item.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredData(filtered);
  };

  const handleSelect = item => {
    onSelect(item);
    setSearchText(item);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchText('');
    onSelect('');
    setFilteredData(data || []);
    setIsOpen(true);
  };

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setFilteredData(data || []);
    }
  };

  return (
    <View
      ref={containerRef}
      style={[styles.container, isOpen && styles.containerOpen, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.dropdownButton, isOpen && styles.dropdownButtonOpen]}
        activeOpacity={0.85}
        onPress={handleToggle}>
        <View style={styles.buttonContent}>
          <Icon name={icon} size={18} color={FORM.icon} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={FORM.placeholder}
            value={searchText}
            onChangeText={handleSearch}
            onFocus={() => {
              setIsOpen(true);
              setFilteredData(data || []);
            }}
          />
          {searchText ? (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icon name="close-circle" size={18} color={FORM.icon} />
            </TouchableOpacity>
          ) : (
            <Icon
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={FORM.icon}
            />
          )}
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownPanel}>
          {filteredData.length > 0 ? (
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={styles.dropdownList}
              showsVerticalScrollIndicator={false}>
              {filteredData.map((item, index) => {
                const selected = searchText === item || value === item;
                return (
                  <TouchableOpacity
                    key={`${item}-${index}`}
                    style={[
                      styles.dropdownItem,
                      index === filteredData.length - 1 && styles.dropdownItemLast,
                    ]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.75}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selected && styles.dropdownItemTextSelected,
                      ]}
                      numberOfLines={1}>
                      {item}
                    </Text>
                    {selected && (
                      <Icon name="checkmark" size={18} color={FORM.teal} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default SearchableDropdown;

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    zIndex: 1,
  },
  containerOpen: {
    zIndex: 20,
  },
  label: {
    ...formStyles.label,
  },
  dropdownButton: {
    backgroundColor: FORM.page,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: FORM.border,
  },
  dropdownButtonOpen: {
    borderColor: FORM.teal,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    gap: 10,
  },
  input: {
    ...formStyles.input,
  },
  clearButton: {
    padding: 2,
  },
  dropdownPanel: {
    backgroundColor: FORM.page,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: FORM.teal,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: '#111820',
    paddingRight: 8,
  },
  dropdownItemTextSelected: {
    color: FORM.teal,
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    fontSize: 13,
    color: FORM.muted,
  },
});
