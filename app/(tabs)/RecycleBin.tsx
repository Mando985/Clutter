import {Link, useFocusEffect} from "expo-router";
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Dimensions, FlatList, Image, Pressable, Text, View} from "react-native";
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from "react-native-safe-area-context";
import * as MediaLibrary from 'expo-media-library';

const RecycleBin = () => {
    const [photos, setPhotos] = useState<{ asset_id: string; asset_uri: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const db = useSQLiteContext();
    const { width } = Dimensions.get('window');
    const numColumns = 4;
    const gap = 3;
    const photoSize = (width - gap * (numColumns + 1)) / numColumns;

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            db.getAllAsync<{ asset_id: string; asset_uri: string }>('SELECT asset_id, asset_uri FROM clutter')
                .then(setPhotos)
                .catch((e) => console.error('Error fetching clutter:', e))
                .finally(() => setLoading(false));
        }, [])
    );


    const Delete = async ()=>{
        try{
            if (!(photos.length === 0)) {
                await MediaLibrary.deleteAssetsAsync(photos.map((p) => p.asset_id));
                await db.runAsync('DELETE FROM clutter');
                setPhotos([]);
            }
        }catch (error){
            console.log(error);
        }
    }

    if (loading) return <ActivityIndicator style={{ margin: 16 }} />;

    if(photos.length>0)
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#012a4a' }}>
            <View style={{flex:1}} className="bg-[#012a4a]">
            <FlatList
                data={photos}
                keyExtractor={(item) => item.asset_id}
                numColumns={numColumns}
                contentContainerStyle={{ padding: gap, paddingBottom: 12 }}
                columnWrapperStyle={{ gap }}
                renderItem={({ item }) => (
                    <Link
                        href={{ pathname: "/restore_action/[id]", params: { asset_id: item.asset_id } }}
                        asChild
                    >
                        <View style={{ width: photoSize, height: photoSize, marginBottom: gap }}>
                            <Image
                                source={{ uri: item.asset_uri }}
                                style={{ width: photoSize, height: photoSize, borderRadius: 12 }}
                                resizeMode="cover"
                            />
                        </View>
                    </Link>
                )}
            />
                <Pressable onPress={Delete} style={{
                    position: 'absolute',
                    bottom: 20,
                    alignSelf: 'center',
                    backgroundColor: '#f94144',
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 999,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                }}>
                    <View >
                        <Text className="text-blue-100">Delete</Text>
                    </View>
                </Pressable>
            </View>

        </SafeAreaView>
    );

    else
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#012a4a' }}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-blue-100 font-mono font-bold text-lg">Nothing in the Bin</Text>
                </View>
            </SafeAreaView>
        );

};

export default RecycleBin;