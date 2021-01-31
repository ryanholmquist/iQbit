// If someone stumbles upon this - for now, this is just a copy/paste of yts.js.
// I need to get in here sometime and try plugging into the TPB API.
// If you want to tackle this, or at least a part of it, please do.


import {Fab, Icon, Button, SearchInput} from "react-onsenui";
import React, {useContext, useState} from "react";
import {IonSpinner} from "@ionic/react";
import axios from "axios";
import imageMissing from "../images/imagemissing.png"
import {Context} from "../App";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {addTorrent} from "../utils/TorrClient";
import {
    faBox,
    faFilmCanister,
    faMedal,
    faTv,
    faUserAstronaut,
    faUsersClass,
    faComments, faStopwatch, faFilm
    ,faFolderDownload
} from "@fortawesome/pro-regular-svg-icons";


const YTSSearch = (props) => {
    const {updateModal} = useContext(Context)
    const [searchTerm,setSearchTerm] = useState(undefined)
    const [searchLoading,setSearchLoading] = useState(false)
    const [searchResults,setSearchResults] = useState([])
    const [searchReady,setSearchReady] = useState(false);

    const submitQuery = () => {
        setSearchLoading(true);
        axios.get("https://yts.mx/api/v2/list_movies.json",{
            params:{
                limit:null,                     //Integer between 1 - 50 (inclusive)
                page:null,                      //Integer (Unsigned)
                quality:null,                   //String (720p, 1080p, 2160p, 3D)
                minimum_rating:null,            //Integer between 0 - 9 (inclusive)
                query_term:searchTerm,          //String
                genre:null,                     //String from http://www.imdb.com/genre/
                sorty_by:null,                  //String (title, year, rating, peers, seeds, download_count, like_count, date_added)
                with_rt_ratings:true,           //Bool
            }
        }).then(response => {
            const moviesArray = response.data.data.movies
            setSearchResults(moviesArray);
            setSearchLoading(false);
            setSearchReady(true);
        })
    }

    return (
        <div>
            <div className={"searchInputRow"}>
                <SearchInput
                    className={"searchInput"}
                    style={{height:"100%"}}
                    placeholder={`Search ${props.category}`}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key==="Enter"? submitQuery(searchTerm) : null}
                />
                {
                    searchLoading ? <IonSpinner name={"lines"}/> :
                        <Fab modifier={"mini"} onClick={()=>submitQuery(searchTerm)}>
                            <Icon icon={"ion-ios-search"} size={25} />
                        </Fab>
                }
            </div>
            <div className={"searchResults"}>
                {
                    searchReady?
                        searchResults ?
                        searchResults.map((item,key) =>
                            <div
                                role={"button"}
                                className={"MoviePoster"}
                                key={key}
                                style={{
                                    backgroundImage: `url(${item.medium_cover_image}), url(${imageMissing})`,
                                }}
                                onClick={()=>{
                                    updateModal({open: true,content:<YTSModalInfo item={item}/>})
                                }}
                            >
                                <span>{item.title}</span>
                            </div>

                        )
                            :<div>No results were found for that search</div>
                        :null
                }
            </div>
        </div>
    )
}

export const YTSModalInfo = (props) => {
    const { item } = props
    const {updateAlert} = useContext(Context)

    const TorrentAttr = (props) => {
        return (
            <span className={"infoTorrentAttr"}>
                <FontAwesomeIcon className={"infoStatIcon"} icon={props.icon} style={{marginRight:props.letter?2:null}}/>
                {props.letter?<span className={"infoStatIcon"}>{props.letter}</span>:null}
                <span>{props.value}</span>
            </span>
        )
    }

    const otherInfo = [
        {
            value: item.language,
            icon: faComments,
            label: "Language"
        },
        {
            value: item.rating,
            icon: faMedal,
            label: "Ratings"
        },
        {
            value: item.runtime+" Minutes",
            icon: faStopwatch,
            label: "Runtime"
        },
        {
            value: item.genres.join(", "),
            icon: faFilm,
            label: "Genres"
        },
    ]

    const [downloadsStarted,setDownloadsStarted] = useState([])

    const handleDownload = (torrent,title,key) =>{

        addTorrent(encodeURI(`magnet:?xt=urn:btih:${torrent.hash}&dn=${title}&udp://open.demonii.com:1337/announce&udp://tracker.openbittorrent.com:80&udp://tracker.coppersurfer.tk:6969&udp://glotorrents.pw:6969/announce&udp://tracker.opentrackr.org:1337/announce&udp://torrent.gresille.org:80/announce&udp://p4p.arenabg.com:1337&udp://tracker.leechers-paradise.org:6969`))
        .then(response=>{
            if(response.data === "Ok."){
                setDownloadsStarted([...downloadsStarted, key])
            }else{
                updateAlert("Could Not Add Torrent","This address could not be added.")
            }
        })
    };

    return (
        <div className={"torrentInfoCol"}>
            <div>
                <h2>{item.title_long}</h2>
                <hr/>
            </div>
            <div className={"infoStatsRowWrapper"}>
                <div className={"infoTitleBox"}>
                    <h3>Torrents</h3>
                </div>
                <div className={"infoStatsRow"}>
                    {item.torrents.map((thisTorrent,key) =>
                        <div className={"infoStatBox flex-row w100"} key={key}>
                            <div className={"attrBox"}>
                                <TorrentAttr icon={faTv} value={thisTorrent.quality}/>
                                <TorrentAttr icon={faFilmCanister} value={thisTorrent.type}/>
                                <TorrentAttr icon={faUserAstronaut} value={thisTorrent.seeds} letter={"S"}/>
                                <TorrentAttr icon={faUsersClass} value={thisTorrent.peers} letter={"P"}/>
                                <TorrentAttr icon={faBox} value={thisTorrent.size}/>
                            </div>
                            {
                                downloadsStarted.includes(key) ?
                                    <FontAwesomeIcon className={"downloadStarted"} icon={faFolderDownload}/>
                                    :
                                    <Button class={"downloadBtn"}
                                            onClick={() => handleDownload(thisTorrent, item.title_long, key)}
                                    >
                                        Download
                                    </Button>

                            }
                        </div>
                    )}
                </div>
            </div>
            <div className={"infoStatsRowWrapper"}>
                <div className={"infoTitleBox"}>
                    <h3>Description</h3>
                </div>
                <p>{item.description_full}</p>
            </div>
            <div className={"infoStatsRowWrapper"}>
                <div className={"infoTitleBox"}>
                    <h3>Other Info</h3>
                </div>
                <div className={"infoStatsRow"}>
                    {otherInfo.map((item,key) =>
                        <div className={"infoStatBox"} key={key}>
                            <h4 className={"infoStat"}>{item.value}</h4>
                            <div>
                                <FontAwesomeIcon className={"infoStatIcon"} icon={item.icon}/>
                                <span className={"infoStatLabel"}>{item.label}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {
                item.yt_trailer_code===""?null:
                    <div className={"infoStatsRowWrapper"}>
                        <div className={"infoTitleBox"}>
                            <h3>Movie Trailer</h3>
                        </div>
                        <iframe
                            className={"movieTrailer"}
                            title={"Movie Trailer"}
                            width="100%" height="450"
                            src={"https://www.youtube.com/embed/"+item.yt_trailer_code}
                        />
                    </div>

            }
        </div>
    )
}

export default YTSSearch;
