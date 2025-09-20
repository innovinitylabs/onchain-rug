#!/bin/bash

# Local Scripty Testing Script
# This script provides easy commands to run your local Scripty tests

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Check if Anvil is running
check_anvil() {
    if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
        print_error "Anvil is not running on localhost:8545"
        print_status "Please start Anvil with: anvil"
        exit 1
    fi
    print_success "Anvil is running"
}

# Check if JavaScript files exist
check_files() {
    local files=("data/rug-p5.js.b64" "data/rug-algo.js.b64")
    local missing_files=()

    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done

    if [ ${#missing_files[@]} -ne 0 ]; then
        print_warning "Missing JavaScript files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        print_status "Tests will skip library upload but continue with other tests"
    else
        print_success "All JavaScript files found"
    fi
}

# Run all tests
run_all_tests() {
    print_header "Running All Local Scripty Tests"
    check_anvil
    check_files
    echo ""

    forge test --match-contract LocalScriptyTest -v
}

# Run specific test
run_specific_test() {
    local test_name="$1"
    print_header "Running Test: $test_name"
    check_anvil
    check_files
    echo ""

    forge test --match-test "$test_name" -v
}

# Run tests with gas reporting
run_gas_report() {
    print_header "Running Tests with Gas Report"
    check_anvil
    check_files
    echo ""

    forge test --match-contract LocalScriptyTest --gas-report -v
}

# Run tests with maximum verbosity
run_verbose() {
    print_header "Running Tests with Maximum Verbosity"
    check_anvil
    check_files
    echo ""

    forge test --match-contract LocalScriptyTest -vvv
}

# Check contract sizes
check_sizes() {
    print_header "Contract Sizes"
    forge build --sizes | grep -E "(Scripty|OnchainRugs|FileStore|ETHFS)"
}

# Show usage
show_usage() {
    print_header "Local Scripty Testing Script"
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  all          Run all tests"
    echo "  deploy       Test infrastructure deployment"
    echo "  html         Test HTML generation"
    echo "  libraries    Test library storage and retrieval"
    echo "  integration  Test OnchainRugs NFT integration"
    echo "  metadata     Test metadata functions"
    echo "  gas          Run tests with gas reporting"
    echo "  verbose      Run tests with maximum verbosity"
    echo "  sizes        Check contract sizes"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all          # Run all tests"
    echo "  $0 html         # Test only HTML generation"
    echo "  $0 gas          # Run with gas reporting"
    echo ""
    print_status "Make sure Anvil is running: anvil"
}

# Main script logic
case "${1:-all}" in
    "all")
        run_all_tests
        ;;
    "deploy")
        run_specific_test "testInfrastructureDeployment"
        ;;
    "html")
        run_specific_test "testHTMLGeneration"
        ;;
    "libraries")
        run_specific_test "testLibraryRetrieval"
        ;;
    "integration")
        run_specific_test "testOnchainRugsIntegration"
        ;;
    "metadata")
        run_specific_test "testMetadataFunctions"
        ;;
    "gas")
        run_gas_report
        ;;
    "verbose")
        run_verbose
        ;;
    "sizes")
        check_sizes
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
