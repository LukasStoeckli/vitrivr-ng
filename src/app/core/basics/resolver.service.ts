import {Injectable} from "@angular/core";
import {ConfigService} from "./config.service";
import {MediaType, MediaTypes} from "../../shared/model/media/media-type.model";
import {SegmentScoreContainer} from "../../shared/model/results/scores/segment-score-container.model";
import {MediaObjectScoreContainer} from "../../shared/model/results/scores/media-object-score-container.model";
import {MediaObject} from "../../shared/model/media/media-object.model";
import {MediaSegment} from "../../shared/model/media/media-segment.model";

/**
 * Definition of the possible tokens that can be used to build the URL.
 */
enum Token {
    OBJECT_ID = ":o",  /* The ID of the media object. */
    OBJECT_NAME = ":n",  /* The file name of the media object. */
    OBJECT_PATH = ":p", /* The path of the media object. */
    OBJECT_TYPE_LOWER = ":t", /* The object's media type in lowercase letters.*/
    OBJECT_TYPE_UPPER = ":T", /* The object's media type in uppercase letters.*/
    SEGMENT_ID = ":s",  /* ID of the media segment (only for thumbnails) .*/
    SUFFIX = ":x" /* Suffix of the thumbnail file as defined in the config.*/
}

/**
 * This class can be used to resolve paths / URL's to media-objects (original file)
 * and previews / thumbnails. It's an injectable, singleton service of Vitrivr NG.
 */
@Injectable()
export class ResolverService {
    /** A map containing the definition of file-suffices for thumbnails per mediatype */
    private suffices : Map<MediaType, string> = new Map();

    /** Host string used when resolving URL's to thumbnails. */
    private host_thumbnails: string;

    /** Host string used when resolving URL's to objects. */
    private host_objects: string;

    /** The RegEx pattern used for replacement. */
    private _regex = new RegExp("(" + [
        Token.OBJECT_ID,
        Token.OBJECT_ID,
        Token.OBJECT_NAME,
        Token.OBJECT_PATH,
        Token.OBJECT_TYPE_LOWER,
        Token.OBJECT_TYPE_UPPER,
        Token.SEGMENT_ID,
        Token.SUFFIX
    ].join("|") + ")", "g");

    /**
     * Default constructor; Initializes the map of suffixes per media-type based on
     * the configuration.
     *
     * @param _configService ConfigService reference; injected.
     */
    constructor(_configService: ConfigService) {
        _configService.asObservable().subscribe((config) => {
            this.host_thumbnails = config.get("resources.host_thumbnails");
            this.host_objects = config.get("resources.host_objects");
            let default_suffix: string = config.get("resources.suffix_default");
            let suffices =  config.get("resources.suffix");
            for (let type of MediaTypes) {
                let suffix: string = suffices[type];
                if (typeof suffix == "string") {
                    this.suffices.set(type, (suffix.charAt(0) == "." ? "" : ".") + suffix);
                } else {
                    this.suffices.set(type, (default_suffix.charAt(0) == "." ? "" : ".") + default_suffix);
                }
            }
        });
    }

    /**
     * Resolves and returns the absolute path / URL to a MediaObject.
     *
     * @param object The MediaObject for which to return the path.
     */
    public pathToObject(object: MediaObject) {

        if (object.path.startsWith("http://") || object.path.startsWith("https://")) {
            // check if IIIF image

            // get imgSize from config
            let iiifUrl = this.pathToIIIFImage(object, "full", "full", "0", "default", "jpg");

            return iiifUrl;
        }

        let rep = {};
        rep[Token.OBJECT_ID] = object.objectId;
        rep[Token.OBJECT_NAME] = object.name;
        rep[Token.OBJECT_PATH] = object.path;
        rep[Token.OBJECT_TYPE_LOWER] = object.mediatype.toLowerCase();
        rep[Token.OBJECT_TYPE_UPPER] = object.mediatype;
        rep[Token.SUFFIX] = this.suffices.get(object.mediatype);
        return this.host_objects.replace(this._regex, (match) => rep[match] || match);
    }

    /**
     * Resolves and returns the absolute path / URL to the thumbnail of a given combination of MediaSegment and MediaObject.
     *
     * @param {MediaObject} object The MediaObject for which to return the path / URL
     * @param {MediaSegment} segment The MediaSegment for which to return the path / URL
     * @return {string}
     */
    public pathToThumbnail(object: MediaObject, segment: MediaSegment) {

        if (object.path.startsWith("http:/") || object.path.startsWith("https:/")) {
            // check if IIIF image

            // get thumbnailSize from config
            let iiifUrl = this.pathToIIIFImage(object, "full", "!200,150", "0", "default", "jpg");

            return iiifUrl;
        }


        let rep = {};
        rep[Token.OBJECT_ID] = object.objectId;
        rep[Token.OBJECT_NAME] = object.name;
        rep[Token.OBJECT_PATH] = object.path;
        rep[Token.OBJECT_TYPE_LOWER] = object.mediatype.toLowerCase();
        rep[Token.OBJECT_TYPE_UPPER] = object.mediatype;
        rep[Token.SUFFIX] = this.suffices.get(object.mediatype);
        rep[Token.SEGMENT_ID] = segment.segmentId;
        return this.host_thumbnails.replace(this._regex, (match) => rep[match] || match);
    }

    /**
     * Builds the IIIF URL from a given MediaObject and IIIF Image API parameters
     *
     * @param {MediaObject} object The MediaObject for which to return the URL
     * @param {String} region TODO
     * @param {String} size TODO
     * @param {String} rotation TODO
     * @param {String} quality TODO
     * @param {String} format TODO
     * @return {string} IIIF Image API URL
     */
    private pathToIIIFImage(object: MediaObject, region: String, size: String, rotation: String, quality: String, format: String) {
        // IIIF Image API
        // {scheme}://{server}{/prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}
        // scheme through identifier are given by object.path
        let iiifUrl = object.path;
        iiifUrl += "/" + region;
        iiifUrl += "/" + size;
        iiifUrl += "/" + rotation;
        iiifUrl += "/" + quality;
        iiifUrl += "." + format;

        return iiifUrl;
    }
}
