import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ProgressBarAndroid,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const Tab = createBottomTabNavigator();

// --- home screen ---
const HomeScreen = () => (
  <ScrollView contentContainerStyle={styles.screen}>
    <Image
      source={{
        uri: "https://via.placeholder.com/150.png?text=Welcome+Home",
      }}
      style={styles.image}
    />
    <Text style={styles.title}>Welcome!</Text>
    <Text style={styles.subtitle}>Your fitness journey starts here.</Text>
  </ScrollView>
);

// --- workout screen ---
const WorkoutScreen = () => (
  <ScrollView contentContainerStyle={styles.screen}>
    <Text style={styles.title}>Workout Plans</Text>
    <TouchableOpacity style={styles.workoutButton}>
      <Text style={styles.buttonText}>10-Minute Stretch</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.workoutButton}>
      <Text style={styles.buttonText}>30-Minute Cardio</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.workoutButton}>
      <Text style={styles.buttonText}>Full-Body Workout</Text>
    </TouchableOpacity>
  </ScrollView>
);

// --- leaderboard screen ---
const LeaderboardScreen = () => (
  <ScrollView contentContainerStyle={styles.screen}>
    <Text style={styles.title}>Leaderboard</Text>
    <View style={styles.leaderboard}>
      <Text style={styles.leaderboardText}>1. John - 10,000 steps</Text>
      <Text style={styles.leaderboardText}>2. Jane - 8,500 steps</Text>
      <Text style={styles.leaderboardText}>3. You - 0 steps</Text>
    </View>
  </ScrollView>
);

// --- step counter screen ---
const StepCounter = () => {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState("checking");
  const [pastStepCount, setPastStepCount] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(10000);

  const scheduleNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Move!",
        body: "Don't forget to achieve your daily step goal!",
      },
      trigger: { seconds: 5 },
    });
  };

  const subscribe = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    setIsPedometerAvailable(String(isAvailable));

    if (isAvailable) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 1);

      const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
      if (pastStepCountResult) {
        setPastStepCount(pastStepCountResult.steps);
      }
      return Pedometer.watchStepCount((result) => {
        setCurrentStepCount(result.steps);
      });
    }
  };

  const saveDailyGoal = async (goal) => {
    try {
      await AsyncStorage.setItem("dailyGoal", goal.toString());
      setDailyGoal(goal);
      Alert.alert("Goal Updated", `Your daily goal is now ${goal} steps!`);
    } catch (e) {
      Alert.alert("Error", "Failed to save the daily goal.");
    }
  };

  const loadDailyGoal = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem("dailyGoal");
      if (savedGoal) setDailyGoal(parseInt(savedGoal, 10));
    } catch (e) {
      Alert.alert("Error", "Failed to load the daily goal.");
    }
  };

  useEffect(() => {
    const subscription = subscribe();
    loadDailyGoal();
    return () => subscription && subscription.remove();
  }, []);

  const progress = Math.min(currentStepCount / dailyGoal, 1);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Step Counter</Text>
      <Image
        source={{ uri: "https://via.placeholder.com/150.png?text=Steps" }}
        style={styles.image}
      />
      <Text style={styles.text}>
        Pedometer Available: {isPedometerAvailable}
      </Text>
      <Text style={styles.text}>Steps Yesterday: {pastStepCount}</Text>
      <Text style={styles.text}>Current Steps: {currentStepCount}</Text>
      <Text style={styles.text}>Daily Goal: {dailyGoal} steps</Text>
      <ProgressBarAndroid
        styleAttr="Horizontal"
        indeterminate={false}
        progress={progress}
      />
      <TouchableOpacity
        style={styles.workoutButton}
        onPress={() => saveDailyGoal(15000)}
      >
        <Text style={styles.buttonText}>Set Goal to 15,000</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.workoutButton} onPress={scheduleNotification}>
        <Text style={styles.buttonText}>Remind Me to Walk</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- main ---
const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: "#f8f9fa" },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Workout"
          component={WorkoutScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name="heartbeat" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name="bar-chart" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="StepCounter"
          component={StepCounter}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name="tachometer" size={size} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

// --- styles ---
const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
  },
  text: {
    fontSize: 18,
    marginVertical: 8,
    color: "#333",
    textAlign: "center",
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius: 10,
  },
  workoutButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    marginVertical: 12,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  leaderboard: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    width: "90%",
    alignItems: "center",
  },
  leaderboardText: {
    fontSize: 16,
    color: "#333",
    textAlign: "left",
  },
});

export default App;
