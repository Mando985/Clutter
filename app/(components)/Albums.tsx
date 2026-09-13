import React, { useState, useCallback } from "react";
import { Text, FlatList, Pressable, View } from "react-native";
import * as MediaLibrary from 'expo-media-library';
import { Album } from "expo-media-library";
import { Link, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

const Albums = () => {
    const db = useSQLiteContext();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [clutterCounts, setClutterCounts] = useState<Record<string, number>>({});

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const fetchedAlbums: Album[] = await MediaLibrary.getAlbumsAsync({
                    includeSmartAlbums: true
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

                const rows: { album_id: string; count: number }[] = await db.getAllAsync(
                    'SELECT album_id, COUNT(*) as count FROM clutter GROUP BY album_id'
                );
                const countMap: Record<string, number> = {};
                rows.forEach((row) => {
                    countMap[row.album_id] = row.count;
                });
                setClutterCounts(countMap);
            };

            load();
        }, [])
    );


    return(

        <View className="bg-[#012a4a]">
        <FlatList data={albums}
                  keyExtractor={(item: Album) => item.id.toString()}
                  numColumns={1}
                  renderItem={({item}) =>
                      <Link href={{
                          pathname: "/album_grid/[id]",
                          params: {album_id: item.id.toString(),album_title:item.title.toString()},
                      }} asChild>
                          <Pressable
                              className="bg-[#013D68] h-25 mx-2 my-1 rounded-2xl items-center justify-center flex flex-col mt-2">

                              <View className="flex-1 ">
                                  <Text className="font-mono font-bold text-2xl text-blue-100">
                                      {item.title.toString()}
                                  </Text>
                              </View>

                              <View className="flex-1">
                                  <Text className="font-mono font-bold text-xl text-blue-100">
                                      Number of assets selected: {clutterCounts[item.id] ?? 0}/{item.assetCount}
                                  </Text>
                              </View>

                          </Pressable>
                      </Link>
                  }
        />
        </View>

    )
}
export default Albums;