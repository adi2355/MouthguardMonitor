import { StyleSheet, View, SafeAreaView, Image, Dimensions, Text } from "react-native";
import { useEffect } from "react";
import { initializeAppOnFirstLaunch, isFirstLaunch } from "@/util/dbManager";

export default function App() {

  useEffect(() => {
    const firstLaunchFlag: Promise<boolean> = isFirstLaunch();
    firstLaunchFlag.then( flag => {
      if (flag) {
        initializeAppOnFirstLaunch();
      }
    });
    
  }, []);

    return (
    <View style={styles.container}>
      <Text>Welcome to Canova's App</Text>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: .5,
    flexDirection: 'column',
    justifyContent: 'center',  
    alignItems: 'center',    
  },
  imageContainer: {
    position: 'absolute', 
    top: -80, 
    width: '90%',
  },
  masterLogo: { 
    width: '100%',
    resizeMode: 'contain',
  },
  text: {
    textAlign: 'center',
  },
  horizontalLine: {
    width: '90%', // Adjust the line width (percentage of the screen width)
    height: 1, // Line thickness
    backgroundColor: '#000', // Line color
    marginTop: 100, // Space above and below the line
    marginBottom: 20, // Space above and below the line
  },
  loginsContainer: {
    display: 'flex',
    flex: 0.5,
    flexDirection: 'row',
    marginTop: 50,
  },
  login: {
    borderColor: '#000',
    borderStyle: 'solid',
  }
});