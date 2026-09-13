import { Skeleton } from '@rneui/themed';
import React from "react";
import {View} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const ActionSkeleton=()=> {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#012a4a" }} className="flex-col">
            <View className="flex-1 grow p-2">
                <Skeleton animation="wave" style={{ flex: 1, borderRadius: 12 }} />
            </View>

            <View className="h-70">
                <View className="flex-row">
                    <View className="flex-1 mt-1">
                        <Skeleton animation="wave" height={80} style={{ borderRadius: 12 }} />
                    </View>
                    <View className="flex-1 ml-1 mt-1">
                        <Skeleton animation="wave" height={80} style={{ borderRadius: 12 }} />
                    </View>
                </View>

                <View className="m-1">
                    <Skeleton animation="wave" height={180} style={{ borderRadius: 12 }} />
                </View>
            </View>
        </SafeAreaView>
    );
}

export default ActionSkeleton