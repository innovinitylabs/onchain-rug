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
//░░░░░░░░░░░░░░░░░    GENERIC HTML    ░░░░░░░░░░░░░░░░░░//
///////////////////////////////////////////////////////////
//
// This module is designed to generate HTML with head and body tags.
//
// eg;
//     <html>
//        <head>
//             <title>Hi</title>
//             <style>[css code]</style>
//         </head>
//         <body>
//             <canvas id="canvas"></canvas>
//             <script>[SCRIPT]</script>
//             <script type="text/javascript+gzip" src="data:text/javascript;base64,[SCRIPT]"></script>
//         </body>
//     </html>
//
// [NOTE]
// If this is your first time using Scripty and you have a
// fairly standard JS structure, this is probably the module
// you will be using.
//
///////////////////////////////////////////////////////////

import {RugHTMLRequest, RugHTMLTagType, RugHTMLTag} from "./RugScriptyStructs.sol";
import {IRugScriptyHTML} from "./IRugScriptyHTML.sol";
import {RugScriptyCore} from "./RugScriptyCore.sol";
import {RugDynamicBuffer} from "./RugDynamicBuffer.sol";

contract RugScriptyHTML is RugScriptyCore, IRugScriptyHTML {
    using RugDynamicBuffer for bytes;

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
    ) public view returns (bytes memory) {

        // calculate buffer size for requests
        uint256 requestBufferSize;
        unchecked {
            if (htmlRequest.headTags.length > 0) {
                requestBufferSize = _rugEnrichHTMLTags(
                    htmlRequest.headTags,
                    false
                );
            }

            if (htmlRequest.bodyTags.length > 0) {
                requestBufferSize += _rugEnrichHTMLTags(
                    htmlRequest.bodyTags,
                    false
                );
            }
        }

        bytes memory htmlFile = RugDynamicBuffer.allocate(
            _rugGetHTMLBufferSize(requestBufferSize)
        );

        // <html>
        htmlFile.appendSafe(RUG_HTML_OPEN_RAW);

        // <head>
        htmlFile.appendSafe(RUG_HEAD_OPEN_RAW);
        if (htmlRequest.headTags.length > 0) {
            _rugAppendHTMLTags(htmlFile, htmlRequest.headTags, false);
        }
        htmlFile.appendSafe(RUG_HEAD_CLOSE_RAW);
        // </head>

        // <body>
        htmlFile.appendSafe(RUG_BODY_OPEN_RAW);
        if (htmlRequest.bodyTags.length > 0) {
            _rugAppendHTMLTags(htmlFile, htmlRequest.bodyTags, false);
        }
        htmlFile.appendSafe(RUG_HTML_BODY_CLOSED_RAW);
        // </body>
        // </html>

        return htmlFile;
    }

    /**
     * @notice Calculates the total buffersize for all elements
     * @param requestBufferSize - Buffersize of request data
     * @return size - Total buffersize of all elements
     */
    function _rugGetHTMLBufferSize(
        uint256 requestBufferSize
    ) private pure returns (uint256 size) {
        unchecked {
            // <html><head></head><body></body></html>
            size = RUG_URLS_RAW_BYTES;
            size += requestBufferSize;
        }
    }

    // =============================================================
    //                      ENCODED HTML GETTERS
    // =============================================================

    /**
     * @notice Get {getHTML} and base64 encode it
     * @param htmlRequest - RugHTMLRequest
     * @return Full HTML with head and body tags, base64 encoded
     */
    function getEncodedHTML(
        RugHTMLRequest memory htmlRequest
    ) public view returns (bytes memory) {
        unchecked {
            bytes memory rawHTML = getHTML(htmlRequest);

            uint256 sizeForEncoding = rugSizeForBase64Encoding(rawHTML.length);
            sizeForEncoding += RUG_HTML_BASE64_DATA_URI_BYTES;

            bytes memory htmlFile = RugDynamicBuffer.allocate(sizeForEncoding);
            htmlFile.appendSafe(RUG_DATA_HTML_BASE64_URI_RAW);
            htmlFile.appendSafeBase64(rawHTML, false, false);
            return htmlFile;
        }
    }

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
    ) public view returns (string memory) {
        return string(getHTML(htmlRequest));
    }

    /**
     * @notice Convert {getEncodedHTML} output to a string
     * @param htmlRequest - RugHTMLRequest
     * @return {getEncodedHTML} as a string
     */
    function getEncodedHTMLString(
        RugHTMLRequest memory htmlRequest
    ) public view returns (string memory) {
        return string(getEncodedHTML(htmlRequest));
    }
}
