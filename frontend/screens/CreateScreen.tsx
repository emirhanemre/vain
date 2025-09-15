import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import CustomHeader from '../components/CustomHeader';

export default function CreateScreen() {
  const [expandedSection, setExpandedSection] = useState(null);
  const [contentType, setContentType] = useState('video');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <View style={styles.screenContainer}>
      <CustomHeader />
      <View style={styles.topContent}>
        <Text style={styles.title}>Create</Text>
        
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('character')}
        >
          <Text style={styles.sectionTitle}>Create Character</Text>
          <Text>{expandedSection === 'character' ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {expandedSection === 'character' && (
          <View style={styles.sectionContent}>
            <View style={styles.previewContainer}>
              <Text style={styles.previewPlaceholder}>Character preview</Text>
            </View>
            <TextInput 
              style={styles.characterInput}
              placeholder="Describe your character..."
              multiline={true}
            />
          </View>
        )}

        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('video')}
        >
          <Text style={styles.sectionTitle}>Generate</Text>
          <Text>{expandedSection === 'video' ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {expandedSection === 'video' && (
          <View style={styles.sectionContent}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, contentType === 'video' && styles.toggleActive]}
                onPress={() => setContentType('video')}
              >
                <Text>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, contentType === 'image' && styles.toggleActive]}
                onPress={() => setContentType('image')}
              >
                <Text>Image</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.promptInput}
              placeholder={`Describe your ${contentType}...`}
              multiline={true}
            />
            <TouchableOpacity style={styles.generateButton}>
              <Text style={styles.generateButtonText}>Generate {contentType}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 10,
    width: '90%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContent: {
    width: '90%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previewContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previewPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  characterInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 5,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  promptInput: {
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});