import {useLocalSearchParams} from "expo-router";
import React, {useEffect, useState} from "react";
import {Pressable, Text, View} from "react-native";
import {SafeAreaView,SafeAreaProvider} from "react-native-safe-area-context";
import {Asset, PagedInfo} from "expo-media-library";
import * as MediaLibrary from 'expo-media-library';
import {Image} from "expo-image";
import {SQLiteDatabase, useSQLiteContext} from "expo-sqlite";


const ActionOnAsset= () =>{
    const { album_id ,asset_id} = useLocalSearchParams();
    const db:SQLiteDatabase = useSQLiteContext();
    const [pics, setPics] = useState<Asset[]>([]);
    const [index, setIndex] = useState(0);
    const [cursor,setCursor] = useState<string|string[]|undefined>(undefined);


    const getPics = async (cursor:string|undefined) => {
        try{
            const deletedPics:any =await db.getAllAsync('SELECT * FROM clutter');
            const AlbumInfo: PagedInfo<Asset> = await MediaLibrary.getAssetsAsync(
                {
                    album: album_id as string,
                    mediaType: ['photo', 'video'],
                    after: cursor,
                    first: 100
                }
            );
            const clutterIds = new Set(deletedPics.map((row: any) => row.asset_id));
            const merged = [...pics, ...AlbumInfo.assets].filter((pic) => !clutterIds.has(pic.id));
            setPics(merged);
            setCursor(AlbumInfo.endCursor);

            const targetId = Array.isArray(asset_id) ? asset_id[0] : asset_id;
            const foundIdx = merged.findIndex((p) => p.id === targetId);
            if (foundIdx !== -1) {
                setIndex(foundIdx);
            } else if (AlbumInfo.hasNextPage) {
                await getPics(AlbumInfo.endCursor); // keep paging until we find it
            }
        }catch (error){
            console.log(error);
        }
    }

    const goNext = async () => {
        if(index<pics.length-1){
            setIndex(index+1);
        }
        else{
            await getPics(cursor);
            setIndex(index+1);
        }
    }

    const goBack = () => {
        if(index>0){
            setIndex(index-1);
        }
    }

    const deletePic = async () => {
        const assetId:string = pics[index]?.id;
        const assetUri:string = pics[index]?.uri;
        await db.runAsync('INSERT INTO clutter (album_id,asset_id,assetUri) VALUES (?,?,?)',album_id.toString(), assetId,assetUri);
        const filtered = pics.filter((pic) => pic.id !== assetId);
        setPics(filtered);
        if (index >= filtered.length - 1) {
            await getPics(cursor);
        }
    }

    useEffect(() => {
        getPics(cursor);
    }, [album_id]);


    if(pics[index]?.uri)
    return(
        <SafeAreaProvider>
            <SafeAreaView>
                <View>
                    <Text>3 buttons goes here</Text>
                    <Text>Number of assets: {pics.length}</Text>
                    <Text>{index}</Text>
                </View>
                <View>
                    <Image source={{uri: pics[index]?.uri}} style={{width: 300, height: 300}}/>
                    <Pressable onPress={() => {goNext()}} >
                        <View className="bg-green-500 h-15 m-5 "><Text>Next</Text></View>
                    </Pressable>
                    <Pressable onPress={() => {goBack()}}>
                        <View className="bg-green-500 h-15 m-5 "><Text>Back</Text></View>
                    </Pressable>
                    <Pressable onPress={() => {deletePic()}}>
                        <View className="bg-green-500 h-15 m-5 "><Text>Delete</Text></View>
                    </Pressable>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>

    );

    console.log(index);
    return (
        <SafeAreaProvider>
            <SafeAreaView>
                <View>
                    <Text>Image Done {asset_id} </Text>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}

export default ActionOnAsset;