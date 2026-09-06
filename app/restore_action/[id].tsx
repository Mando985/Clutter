import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { useVideoPlayer, VideoView } from "expo-video";

type ClutterRow = { asset_id: string; asset_uri: string; album_id: string };

const VIDEO_EXT = /\.(mp4|mov|m4v|avi|3gp)$/i;

const ActionOnAsset = () => {
    const { asset_id } = useLocalSearchParams();
    const db: SQLiteDatabase = useSQLiteContext();
    const [pics, setPics] = useState<ClutterRow[]>([]);
    const [index, setIndex] = useState(0);

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
         // already at/past "Done" screen, don't climb further
        if (isVideo || index >= pics.length) try { player.pause(); } catch {}
        if(!(index === pics.length-1)) {
            setIndex((i) => i + 1);
        }
    };

    const goBack = () => {
        if (index > 0) {
            if (isVideo) try { player.pause(); } catch {}
            setIndex((i) => i - 1);
        }
    };

    const restorePic = async () => {
        if (isVideo) try { player.pause(); } catch {}
        const assetId = current?.asset_id;
        await db.runAsync('DELETE FROM clutter WHERE asset_id = ?', assetId);
        setPics((prev) => prev.filter((pic) => pic.asset_id !== assetId));
    };

    if (current)
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <View>
                    <Text>URI : {current.asset_uri}</Text>
                    <Text>Number of assets: {pics.length}</Text>
                    <Text>{index}</Text>

                    {isVideo ? (
                        <VideoView
                            key={current.asset_id}
                            style={{ width: 300, height: 300 }}
                            player={player}
                            nativeControls
                        />
                    ) : (
                        <Image source={{ uri: current.asset_uri }} style={{ width: 300, height: 300 }} />
                    )}
                </View>
                <View>
                    <Pressable onPress={goNext}>
                        <View className="bg-green-500 h-15 m-5"><Text>Next</Text></View>
                    </Pressable>
                    <Pressable onPress={goBack}>
                        <View className="bg-green-500 h-15 m-5"><Text>Back</Text></View>
                    </Pressable>
                    <Pressable onPress={restorePic}>
                        <View className="bg-green-500 h-15 m-5"><Text>Restore</Text></View>
                    </Pressable>
                </View>
            </SafeAreaView>
        );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Text>Image Done {asset_id}</Text>
        </SafeAreaView>
    );
};

export default ActionOnAsset;