import {useLocalSearchParams} from "expo-router";
import React, {useEffect, useRef, useState} from "react";
import {Pressable, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Asset, PagedInfo} from "expo-media-library";
import * as MediaLibrary from 'expo-media-library';
import {Image} from "expo-image";
import {SQLiteDatabase, useSQLiteContext} from "expo-sqlite";
import {useVideoPlayer, VideoView} from "expo-video";
import ActionSkeleton from "@/app/(components)/ActionSkeleton";


const ActionOnAsset = () => {
    const {album_id, asset_id} = useLocalSearchParams();
    const db: SQLiteDatabase = useSQLiteContext();
    const [pics, setPics] = useState<Asset[]>([]);
    const [index, setIndex] = useState(0);
    const [displayUri, setDisplayUri] = useState<string | undefined>(undefined);
    const [cursor, setCursor] = useState<string | string[] | undefined>(undefined);
    const [hasResolved, setHasResolved] = useState(false);
    const isBusy = useRef(false);

    const getPics = async (cursor: string | undefined) => {
        try {
            const deletedPics: any = await db.getAllAsync('SELECT * FROM clutter');
            const AlbumInfo: PagedInfo<Asset> = await MediaLibrary.getAssetsAsync(
                {
                    album: album_id as string,
                    mediaType: ['photo', 'video', 'unknown'],
                    after: cursor,
                    first: 100,
                    sortBy: [['modificationTime', false]],
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
        } catch (error) {
            console.log(error);
        }
    }


    const player = useVideoPlayer(pics[index]?.mediaType === 'video' ? displayUri ?? null : null, player => {
        player.loop = true;
        player.play();
    });

    const goNext = async () => {
        if (isBusy.current) return;
        isBusy.current = true;
        try{
            if (index < pics.length - 1) {
                try {
                    player.pause();
                } catch {
                }
                setIndex(index + 1);
            } else {
                try {
                    player.pause();
                } catch {
                }
                await getPics(cursor);
                setIndex(index + 1);
            }
        }finally{
            isBusy.current = false;
        }
    }

    const goBack = () => {
        if (isBusy.current) return;
        isBusy.current = true;
        try{
            if (index > 0) {
                try {
                    player.pause();
                } catch {
                }
                setIndex(index - 1);
            }
        }finally {
            isBusy.current = false;
        }
    }
    const deletePic = async () => {
        if(isBusy.current) return;
        isBusy.current=true;
        try{
            try {
                player.pause();
            } catch {
            }
            const assetId: string = pics[index]?.id;
            const assetUri: string = pics[index]?.uri;
            await db.runAsync('INSERT INTO clutter (album_id,asset_id,asset_uri) VALUES (?,?,?)', album_id.toString(), assetId, assetUri);
            const filtered = pics.filter((pic) => pic.id !== assetId);
            setPics(filtered);

            if (index >= filtered.length) {
                await getPics(cursor);
            }
        }finally{
            isBusy.current = false;
        }

    }

    useEffect(() => {
        getPics(cursor);
    }, [album_id]);

    useEffect(() => {
        const current = pics[index];
        if (!current) {
            setDisplayUri(undefined);
            return;
        }
        // While still searching for the initial target, ignore anything that isn't the asset we navigated in for.
        if (!hasResolved) {
            if (current.id !== asset_id) return;
            setHasResolved(true);
        }

        MediaLibrary.getAssetInfoAsync(current)
            .then((info) => setDisplayUri(info.localUri ?? info.uri))
            .catch(() => setDisplayUri(current.uri));
    }, [index, pics, asset_id, hasResolved]);

    if (displayUri)
        return (
            <SafeAreaView style={{ flex: 1,backgroundColor:"#012a4a" }} className="flex-col">

                <View className="flex-1  grow">
                    {(pics[index]?.mediaType === 'video') ? (
                        <VideoView
                            key={pics[index]?.id}
                            style={{flex: 1}}
                            player={player}
                            nativeControls
                        />

                    ) : (
                        <Image source={{uri: displayUri}} style={{flex: 1}} contentFit="contain" autoplay/>
                    )}
                </View>

                <View className="h-70">
                    <View className="flex-row">
                        <Pressable className="flex-1" onPress={() => {
                            goBack()
                        }}>
                            {({pressed}) => (
                                <View
                                    className="rounded-xl items-center justify-center h-20 mt-1"
                                    style={{backgroundColor: pressed ? "#1f6485" : "#277da1"}}
                                >
                                    <Text className="font-mono font-bold text-5xl text-blue-100">Back</Text>
                                </View>
                            )}
                        </Pressable>

                        <Pressable className="flex-1" onPress={() => {
                            goNext()
                        }}>
                            {({pressed}) => (
                                <View
                                    className="rounded-xl items-center justify-center h-20 ml-1 mt-1"
                                    style={{backgroundColor: pressed ? "#38957c" : "#43aa8b"}}
                                >
                                    <Text className="font-mono font-bold text-5xl text-blue-100">Next</Text>
                                </View>
                            )}
                        </Pressable>
                    </View>

                    <Pressable onPress={() => {
                        deletePic()
                    }}>
                        {({pressed}) => (
                            <View
                                className="rounded-xl items-center justify-center h-45 m-1"
                                style={{backgroundColor: pressed ? "#d93033" : "#f94144"}}
                            >
                                <Text className="font-mono font-bold text-5xl text-blue-100">Delete</Text>
                            </View>
                        )}
                    </Pressable>
                </View>
            </SafeAreaView>
        );

    return (
            <SafeAreaView style={{flex:1}}>
                <ActionSkeleton/>
            </SafeAreaView>
    )
}

export default ActionOnAsset;