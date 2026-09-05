import "@/global.css";
import React, {useState,useEffect} from "react";
import {View,Text} from "react-native";
import * as MediaLibrary from 'expo-media-library';
import Albums from "@/app/(components)/Albums";
import {SafeAreaView} from "react-native-safe-area-context";

export default function App() {
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const [loading,setLoading] = useState(false);

    useEffect(()=>{
        const getUserPermission= async ()=> {
            if (permissionResponse?.status !== 'granted') {
                await requestPermission();
            }
            else{
            setLoading(true);
            }
        }
            getUserPermission();
        }
    ,[loading,permissionResponse]);


    return (
        (!loading)?
            (
                (permissionResponse?.status === 'denied')?
                    (
                        <SafeAreaView>
                            <View>
                                <Text>
                                    Denied
                                </Text>
                            </View>
                        </SafeAreaView>
                    ):
                    <View>
                        {/* blank page */}
                    </View>
            ) :
            (
                <Albums/>
            )
    )
}