import * as MediaLibrary from 'expo-media-library';
import { Link, useLocalSearchParams } from "expo-router";
import React from 'react';
import { useState, useEffect, useCallback, useRef } from "react";
import {ActivityIndicator, Dimensions, FlatList, Image, Text, View} from "react-native";
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import {SafeAreaView} from "react-native-safe-area-context";

const DisplayPhotos = () => {
    const { album_id } = useLocalSearchParams();
    const albumId = Array.isArray(album_id) ? album_id[0] : album_id;

    const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
    const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [movedIds, setMovedIds] = useState<Set<string>>(new Set());

    const isFetchingRef = useRef(false);

    const db = useSQLiteContext();

    const { width } = Dimensions.get('window');
    const numColumns = 4;
    const gap = 3;
    const photoSize = (width - gap * (numColumns + 1)) / numColumns;

    //Checks by the db to get all the assets marked in this particular album
    useFocusEffect(
        useCallback(() => {
            db.getAllAsync<{ asset_id: string }>('SELECT asset_id FROM clutter WHERE album_id = ?', albumId)
                .then((rows) => setMovedIds(new Set(rows.map((r) => r.asset_id))))
                .catch((error) => console.error(`Error fetching moved asset ids: ${error}`));
        }, [albumId])
    );

    const getPhotos = useCallback(async () => {
        if (isFetchingRef.current || !hasNextPage) return;
        isFetchingRef.current = true;
        setLoadingMore(true);

        try {
            const photoArray = await MediaLibrary.getAssetsAsync({
                album: albumId,
                mediaType: ['photo', 'video'],
                first: 100,
                after: endCursor,
                sortBy: [['modificationTime', false]],
            });

            setPhotos((pictures) => {
                const existingIds = new Set(pictures.map((p) => p.id));
                const newOnes = photoArray.assets.filter((a) => !existingIds.has(a.id));
                return [...pictures, ...newOnes];
            });

            setEndCursor(photoArray.endCursor);
            setHasNextPage(photoArray.hasNextPage);
        } catch (error) {
            console.error(`Error Occured, cannot fetch array of Photos: ${error}`);
        } finally {
            isFetchingRef.current = false;
            setLoadingMore(false);
        }
    }, [albumId, endCursor, hasNextPage]);

    useEffect(() => {
        setPhotos([]);
        setEndCursor(undefined);
        setHasNextPage(true);
        isFetchingRef.current = false;
    }, [albumId]);

    useEffect(() => {
        if (photos.length === 0 && hasNextPage) {
            getPhotos();
        }
    }, [photos.length]);


    return (
        <SafeAreaView style={{ flex:1,backgroundColor: "#012a4a" }}>

            <FlatList
                data={photos}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                contentContainerStyle={{ padding: gap,paddingBottom: 12 }}
                columnWrapperStyle={{ gap }}
                onEndReached={getPhotos}
                onEndReachedThreshold={0.5}
                renderItem={({ item }) => (
                    <Link
                        href={{
                            pathname: "/delete_action/[id]",
                            params: { album_id: album_id.toString(), asset_id: item.id, }
                        }}
                        asChild
                    >
                        <View style={{ width: photoSize, marginBottom: gap }}>
                            <View style={{ width: photoSize, height: photoSize }}>
                                <Image
                                    source={{ uri: item.uri }}
                                    style={{
                                        width: photoSize,
                                        height: photoSize,
                                        borderRadius: 12,
                                    }}
                                    resizeMode="cover"
                                />

                                {/*A red colour is placed above the thumbnail to show is marked */}
                                {movedIds.has(item.id) && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: 'rgba(255, 0, 0, 0.61)',
                                            borderRadius: 12,
                                        }}
                                    />
                                )}
                            </View>
                        </View>
                    </Link>
                )}

                ListFooterComponent={
                    loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null
                }
            />

        </SafeAreaView>
    );
}

export default DisplayPhotos