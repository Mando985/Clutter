```
import { Stack } from "expo-router";
import React from "react";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import {SafeAreaProvider} from "react-native-safe-area-context";

export default function RootLayout() {
    const initDb = async (db: SQLiteDatabase) => {
        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS clutter (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              album_id TEXT NOT NULL,
              asset_id TEXT UNIQUE,
              asset_uri TEXT NOT NULL,
              created_at INTEGER DEFAULT (strftime('%s','now'))
            );`
        );
    }
    return (
        <SafeAreaProvider>
            <SQLiteProvider databaseName="clutter.db" onInit={initDb}>
                <Stack screenOptions={{headerShown:false}}/>
            </SQLiteProvider>
        </SafeAreaProvider>
    );

}
```
```

```
import "@/global.css";
import React, {useState,useEffect} from "react";
import {View,Text} from "react-native";
import * as MediaLibrary from 'expo-media-library';
import Albums from "@/app/(components)/Albums";
import {SafeAreaView} from "react-native-safe-area-context";
import { Platform } from 'react-native';

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
    },[loading,permissionResponse]);


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
                <SafeAreaView edges={Platform.OS === 'android' ? ['left','top', 'right'] : ['left','top', 'right']}
                              style={{ flex: 1 }}>
                    <Albums/>
                </SafeAreaView>
            )
    )
}
```
```

```
import {Tabs} from "expo-router"
import React from "react";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {View} from "react-native";

const TabLayout = () => (

        <Tabs screenOptions={{headerShown: false,}}>
            <Tabs.Screen name="index" options={{title: "Albums"}}/>
            <Tabs.Screen name="RecycleBin" options={{title: "Recycle Bin"}}/>
        </Tabs>


);

export default TabLayout;

```
```

```
import * as MediaLibrary from 'expo-media-library';
import {Album} from "expo-media-library";
import {Link} from "expo-router";
import React, {useState,useEffect} from "react";
import {Text, FlatList, Pressable, View} from "react-native";

const Albums = () => {
    const [albums, setAlbums] = useState<Album[]>([]);
    useEffect(() => {
        const getAlbums = async () => {
            const fetchedAlbums: Album[] = await MediaLibrary.getAlbumsAsync({
                includeSmartAlbums: true,
            });

            const filteredAlbums = (
                await Promise.all(
                    fetchedAlbums.map(async (album) => {
                        const { totalCount } = await MediaLibrary.getAssetsAsync({
                            album: album.id,
                            mediaType: ['photo', 'video'],
                            first: 1,
                        });
                        return totalCount > 0 ? album : null;
                    })
                )
            ).filter((album): album is Album => album !== null);

            setAlbums(filteredAlbums);
        }
        getAlbums();
    }, []);

    return(
        <View>
        <FlatList data={albums}
                  keyExtractor={(item: Album) => item.id.toString()}
                  numColumns={1}
                  renderItem={({item}) =>
                      <Link href={{
                          pathname: "/album_grid/[id]",
                          params: {album_id: item.id.toString(),album_title:item.title.toString()},
                      }} asChild>
                          <Pressable
                              className="bg-blue-400 h-15 mx-2 my-1 rounded-2xl items-center justify-center">
                              <Text>
                                  Item Title : {item.title.toString()} <></>
                                  Number of Assets : {item.assetCount}
                              </Text>
                          </Pressable>
                      </Link>
                  }
        />
        </View>

    )
}
export default Albums;

```
```

```
import * as MediaLibrary from 'expo-media-library';
import { Link, useLocalSearchParams } from "expo/router";
import React from 'react';
import { useState, useEffect, useCallback, useRef } from "react";
import {ActivityIndicator, Dimensions, FlatList, Image, Text, View} from "react-native";
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo/router';
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
                sortBy: [['creationTime', false]],
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
        <SafeAreaView >
        <View >
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
        </View>

        </SafeAreaView>
    );
}

export default DisplayPhotos

```
```

```
import {useLocalSearchParams} from "expo/router";
import React, {useEffect, useState} from "react";
import {Pressable, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Asset, PagedInfo} from "expo-media-library";
import * as MediaLibrary from 'expo-media-library';
import {Image} from "expo-image";
import {SQLiteDatabase, useSQLiteContext} from "expo-sqlite";
import {useVideoPlayer, VideoView} from "expo-video";

const ActionOnAsset = () => {
    const {album_id, asset_id} = useLocalSearchParams();
    const db: SQLiteDatabase = useSQLiteContext();
    const [pics, setPics] = useState<Asset[]>([]);
    const [index, setIndex] = useState(0);
    const [displayUri, setDisplayUri] = useState<string | undefined>(undefined);
    const [cursor, setCursor] = useState<string | string[] | undefined>(undefined);

    const getPics = async (cursor: string | undefined) => {
        try {
            const deletedPics: any = await db.getAllAsync('SELECT * FROM clutter');
            const AlbumInfo: PagedInfo<Asset> = await MediaLibrary.getAssetsAsync(
                {
                    album: album_id as string,
                    mediaType: ['photo', 'video', 'unknown'],
                    after: cursor,
                    first: 100,
                    sortBy: [['creationTime', false]],
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
        if (index < pics.length - 1) {
            try { player.pause(); } catch {}
            setIndex(index + 1);
        } else {
            try { player.pause(); } catch {}
            await getPics(cursor);
            setIndex(index + 1);

        }
    }
    const goBack = () => {
        if (index > 0) {
            try { player.pause(); } catch {}
            setIndex(index - 1);

        }
    }
    const deletePic = async () => {
        try { player.pause(); } catch {}
        const assetId: string = pics[index]?.id;
        const assetUri: string = pics[index]?.uri;
        await db.runAsync('INSERT INTO clutter (album_id,asset_id,asset_uri) VALUES (?,?,?)', album_id.toString(), assetId, assetUri);
        const filtered = pics.filter((pic) => pic.id !== assetId);
        setPics(filtered);

        if (index >= filtered.length ) {
            await getPics(cursor);
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
        MediaLibrary.getAssetInfoAsync(current)
            .then((info) => setDisplayUri(info.localUri ?? info.uri))
            .catch(() => setDisplayUri(current.uri));
    }, [index, pics]);

    if (displayUri)
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <View>
                    <Text>URI : {displayUri}</Text>
                    <Text>Number of assets: {pics.length}</Text>
                    <Text>{index}  </Text>

                    {(pics[index]?.mediaType==='video')?(
                        <VideoView
                            key={pics[index]?.id}
                            style={{ width: 300, height: 300 }}
                            player={player}
                            nativeControls
                        />

                        ):(
                        <Image source={{uri: displayUri}} style={{width: 300, height: 300}} autoplay/>
                    )}
                </View>
                <View>
                    <Pressable onPress={() => {
                        goNext()
                    }}>
                        <View className="bg-green-500 h-15 m-5 "><Text>Next</Text></View>
                    </Pressable>
                    <Pressable onPress={() => {
                        goBack()
                    }}>
                        <View className="bg-green-500 h-15 m-5 "><Text>Back</Text></View>
                    </Pressable>
                    <Pressable onPress={() => {
                        deletePic()
                    }}>
                        <View className="bg-green-500 h-15 m-5 "><Text>Delete</Text></View>
                    </Pressable>
                </View>
            </SafeAreaView>
        );


    console.log(index);
    return (
            <SafeAreaView style={{flex:1}}>
                <View style={{flex:1}}>
                    <Text>Image Done {asset_id} </Text>
                </View>
            </SafeAreaView>
    )
}

export default ActionOnAsset;

```
```

```
import { useLocalSearchParams } from "expo/router";
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

```