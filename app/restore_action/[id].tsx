import { useLocalSearchParams } from "expo-router";
import React, {useEffect, useRef, useState} from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { useVideoPlayer, VideoView } from "expo-video";
import ActionSkeleton from "@/app/(components)/ActionSkeleton";

type ClutterRow = { asset_id: string; asset_uri: string; album_id: string };

const VIDEO_EXT = /\.(mp4|mov|m4v|avi|3gp)$/i;

const ActionOnAsset = () => {
    const { asset_id } = useLocalSearchParams();
    const db: SQLiteDatabase = useSQLiteContext();
    const [pics, setPics] = useState<ClutterRow[]>([]);
    const [index, setIndex] = useState(0);
    const isBusy = useRef(false);


    useEffect(() => {
        db.getAllAsync<ClutterRow>('SELECT asset_id, asset_uri, album_id FROM clutter')
            .then((rows) => {
                setPics(rows);
                const targetId = Array.isArray(asset_id) ? asset_id[0] : asset_id;
                const foundIdx = rows.findIndex((p) => p.asset_id === targetId);
                if (foundIdx !== -1) setIndex(foundIdx);
            })
            .catch((e) => console.error('Error fetching clutter:', e));
    }, []);

    const current = pics[index];
    const isVideo = current ? VIDEO_EXT.test(current.asset_uri) : false;

    const player = useVideoPlayer(isVideo ? current.asset_uri : null, (player) => {
        player.loop = true;
        player.play();
    });


    const goNext = () => {
        if (isBusy.current) return;
        isBusy.current = true;
        try {
            // already at/past "Done" screen, don't climb further
            if (isVideo || index >= pics.length) try { player.pause(); } catch {}
            if (!(index === pics.length - 1)) {
                setIndex((i) => i + 1);
            }
        } finally {
            isBusy.current = false;
        }
    };

    const goBack = () => {
        if (isBusy.current) return;
        isBusy.current = true;
        try {
            if (index > 0) {
                if (isVideo) try { player.pause(); } catch {}
                setIndex((i) => i - 1);
            }
        } finally {
            isBusy.current = false;
        }
    };

    const restorePic = async () => {
        if (isBusy.current) return;
        isBusy.current = true;
        try {
            if (isVideo) try { player.pause(); } catch {}
            const assetId = current?.asset_id;
            await db.runAsync('DELETE FROM clutter WHERE asset_id = ?', assetId);
            setPics((prev) => prev.filter((pic) => pic.asset_id !== assetId));
        } finally {
            isBusy.current = false;
        }
    };

    if (current)
        return (
            <SafeAreaView style={{ flex: 1,backgroundColor:"#012a4a"}} className="flex-col">

                <View className="flex-1 grow">
                    {isVideo ? (
                        <VideoView
                            key={current.asset_id}
                            style={{ flex: 1 }}
                            player={player}
                            nativeControls
                        />
                    ) : (
                        <Image source={{ uri: current.asset_uri }} style={{ flex: 1 }} contentFit="contain" autoplay />
                    )}
                </View>

                <View className="h-70">
                    <View className="flex-row">
                        <Pressable className="flex-1" onPress={goBack}>
                            {({ pressed }) => (
                                <View
                                    className="rounded-xl items-center justify-center h-20 mt-1"
                                    style={{ backgroundColor: pressed ? "#1f6485" : "#277da1" }}
                                >
                                    <Text className="font-mono font-bold text-5xl text-blue-100">Back</Text>
                                </View>
                            )}
                        </Pressable>

                        <Pressable className="flex-1" onPress={goNext}>
                            {({ pressed }) => (
                                <View
                                    className="rounded-xl items-center justify-center h-20 ml-1 mt-1"
                                    style={{ backgroundColor: pressed ? "#38957c" : "#43aa8b" }}
                                >
                                    <Text className="font-mono font-bold text-5xl text-blue-100">Next</Text>
                                </View>
                            )}
                        </Pressable>
                    </View>

                    <Pressable onPress={restorePic}>
                        {({ pressed }) => (
                            <View
                                className="rounded-xl items-center justify-center h-45 m-1"
                                style={{ backgroundColor: pressed ? "#02ad8a" : "#02c39a" }}
                            >
                                <Text className="font-mono font-bold text-5xl text-blue-100">Restore</Text>
                            </View>
                        )}
                    </Pressable>
                </View>
            </SafeAreaView>
        );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ActionSkeleton/>
        </SafeAreaView>
    );
};

export default ActionOnAsset;