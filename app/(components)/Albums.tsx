import React, {useState,useEffect} from "react";
import {Text, FlatList, Pressable} from "react-native";
import * as MediaLibrary from 'expo-media-library';
import {Album} from "expo-media-library";
import {Link} from "expo-router";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

const Albums = () => {
    const [albums, setAlbums] = useState<Album[]>([]);
    useEffect(() => {
        const getAlbums = async () => {
            const fetchedAlbums:Album[] = await MediaLibrary.getAlbumsAsync({includeSmartAlbums: true,});
            setAlbums(fetchedAlbums);
        }
        getAlbums();
    }, []);

    return(
        <SafeAreaProvider>
            <SafeAreaView className="flex-1">
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
                                      Item ID: {item.id.toString()}
                                  </Text>
                              </Pressable>
                          </Link>
                      }
            />
            </SafeAreaView>
        </SafeAreaProvider>

    )
}
export default Albums;