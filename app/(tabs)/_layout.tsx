import {Tabs} from "expo-router"
import React from "react";
import {SafeAreaProvider} from "react-native-safe-area-context";

const TabLayout= ()=>
        <Tabs screenOptions={{headerShown: false}}>
            <Tabs.Screen name="index" options={{title: "Albums"}}/>
            <Tabs.Screen name="RecycleBin" options={{title: "Recycle Bin"}}/>
        </Tabs>

export default TabLayout;
