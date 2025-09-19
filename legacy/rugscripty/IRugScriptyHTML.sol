// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

///////////////////////////////////////////////////////////
// ░██████╗░█████╗░██████╗░██╗██████╗░████████╗██╗░░░██╗ //
// ██╔════╝██╔══██╗██╔══██╗██║██╔══██╗╚══██╔══╝╚██╗░██╔╝ //
// ╚█████╗░██║░░╚═╝██████╔╝██║██████╔╝░░░██║░░░░╚████╔╝░ //
// ░╚═══██╗██║░░██╗██╔══██╗██║██╔═══╝░░░░██║░░░░░╚██╔╝░░ //
// ██████╔╝╚█████╔╝██║░░██║██║██║░░░░░░░░██║░░░░░░██║░░░ //
// ╚═════╝░░╚════╝░╚═╝░░╚═╝╚═╝╚═╝░░░░░░░░╚═╝░░░░░░╚═╝░░░ //
///////////////////////////////////////////////////////////

import {RugHTMLRequest, RugHTMLTagType, RugHTMLTag} from "./RugScriptyStructs.sol";

interface IRugScriptyHTML {
    // =============================================================
    //                      RAW HTML GETTERS
    // =============================================================

    /**
     * @notice  Get HTML with requested head tags and body tags
     * @dev Your HTML is returned in the following format:
     *      <html>
     *          <head>
     *              [tagOpen[0]][contractRequest[0] | tagContent[0]][tagClose[0]]
     *              [tagOpen[1]][contractRequest[0] | tagContent[1]][tagClose[1]]
     *              ...
     *              [tagOpen[n]][contractRequest[0] | tagContent[n]][tagClose[n]]
     *          </head>
     *          <body>
     *              [tagOpen[0]][contractRequest[0] | tagContent[0]][tagClose[0]]
     *              [tagOpen[1]][contractRequest[0] | tagContent[1]][tagClose[1]]
     *              ...
     *              [tagOpen[n]][contractRequest[0] | tagContent[n]][tagClose[n]]
     *          </body>
     *      </html>
     * @param htmlRequest - RugHTMLRequest
     * @return Full HTML with head and body tags
     */
    function getHTML(
        RugHTMLRequest memory htmlRequest
    ) external view returns (bytes memory);

    // =============================================================
    //                      ENCODED HTML GETTERS
    // =============================================================

    /**
     * @notice Get {getHTML} and base64 encode it
     * @param htmlRequest - RugHTMLRequest
     * @return Full HTML with head and script tags, base64 encoded
     */
    function getEncodedHTML(
        RugHTMLRequest memory htmlRequest
    ) external view returns (bytes memory);

    // =============================================================
    //                      STRING UTILITIES
    // =============================================================

    /**
     * @notice Convert {getHTML} output to a string
     * @param htmlRequest - RugHTMLRequest
     * @return {getHTMLWrapped} as a string
     */
    function getHTMLString(
        RugHTMLRequest memory htmlRequest
    ) external view returns (string memory);

    /**
     * @notice Convert {getEncodedHTML} output to a string
     * @param htmlRequest - RugHTMLRequest
     * @return {getEncodedHTML} as a string
     */
    function getEncodedHTMLString(
        RugHTMLRequest memory htmlRequest
    ) external view returns (string memory);
}
