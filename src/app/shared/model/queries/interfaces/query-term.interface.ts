import {QueryTermType} from "./query-term-type.interface";

/**
 * General interface of a QueryTerm.
 */
export interface QueryTermInterface {
    /**
     * List of retrieval categories that should be used as part of this findSimilar.
     */
    categories : string[];

    /**
     * String representation of the data. This could be a base64 encoded image or audio stream.
     */
    data: string;

    /**
     * Type of QueryTerm. Must correspond to one the types defined above.
     */
    type: QueryTermType

    /**
     * Adds a named query category to the QueryTerm. The implementation must make sure, that
     * the category is unique.
     *
     * @param {string} category
     */
    pushCategory(category: string);

    /**
     * Removes a named query category to the QueryTerm. The implementation must make sure, that
     * the category is unique.
     *
     * @param {string} category
     */
    removeCategory(category: string);

    /**
     * Returns true if QueryTerm contains specified category and false otherwise.
     *
     * @param {string} category Category that should be checked,
     * @return {boolean} True if category is contained, else false.
     */
    hasCategory(category: string): boolean;

    /**
     * Replaces all the existing categories by the provided categories.
     *
     * @param {string} categories
     */
    setCategories(categories: string[]);

    /**
     * Returns a JSON object representing the current QueryTermInterface instance.
     */
    toJson() : any;
}