import React, { useState } from 'react';
import { View, Text, Modal, TextInput, Button, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function JournalCalendar() {
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [entries, setEntries] = useState({});
  const [currentEntry, setCurrentEntry] = useState('');

  const handleDayPress = (day) => {
    const date = day.dateString;
    setSelectedDate(date);
    setCurrentEntry(entries[date] || '');
    setModalVisible(true);
  };

  const saveEntry = () => {
    setEntries({ ...entries, [selectedDate]: currentEntry });
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Calendar */}
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          ...Object.keys(entries).reduce((acc, date) => {
            acc[date] = { marked: true };
            return acc;
          }, {}),
          [selectedDate]: { selected: true, selectedColor: '#12a35f' },
        }}
      />

      {/* Modal for journal entry */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Journal Entry for {selectedDate}
            </Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Write your journal entry here..."
              value={currentEntry}
              onChangeText={setCurrentEntry}
            />
            <View style={styles.modalButtons}>
              <Button title="Save" onPress={saveEntry} />
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Display Saved Entries */}
      <View style={styles.entriesContainer}>
        <Text style={styles.entriesTitle}>Saved Journal Entries:</Text>
        {Object.keys(entries).length > 0 ? (
          Object.entries(entries).map(([date, entry]) => (
            <View key={date} style={styles.entry}>
              <Text style={styles.entryDate}>{date}</Text>
              <Text style={styles.entryText}>{entry}</Text>
            </View>
          ))
        ) : (
          <Text>No journal entries yet.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  entriesContainer: {
    marginTop: 20,
  },
  entriesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  entry: {
    marginBottom: 10,
  },
  entryDate: {
    fontWeight: 'bold',
  },
  entryText: {
    fontSize: 14,
  },
});
