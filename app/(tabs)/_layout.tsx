import {Tabs} from "expo-router"
import React from "react";
import { Ionicons } from '@expo/vector-icons';


const TabLayout = () => (

        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#FEFEFA",
            tabBarInactiveTintColor: "#94a3b8",
            tabBarStyle: { backgroundColor: "#224C98" },
        }} >
            <Tabs.Screen name="index" options={{
                    title: "Albums",tabBarIcon: ({ color, size }) => (
                        <Ionicons name="images" size={size} color={color} />),
                    }}
            />
            <Tabs.Screen name="RecycleBin" options={{
                    title: "Recycle Bin",tabBarIcon: ({ color, size }) => (
                    <Ionicons name="trash" size={size} color={color} />),
                    }}
            />
        </Tabs>


);

export default TabLayout;