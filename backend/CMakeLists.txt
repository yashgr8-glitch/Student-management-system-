cmake_minimum_required(VERSION 3.16)
project(student_record_api LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(Threads REQUIRED)
find_package(PkgConfig QUIET)

# Dependency paths vary by operating system. Crow is header-only; install it
# and MySQL Connector/C++ using your system package manager or vendor packages.
find_path(CROW_INCLUDE_DIR crow.h PATH_SUFFIXES crow)
find_path(MYSQLCPPCONN_INCLUDE_DIR mysql/jdbc.h)
find_library(MYSQLCPPCONN_LIBRARY NAMES mysqlcppconn mysqlcppconn8)

if(NOT CROW_INCLUDE_DIR)
  message(FATAL_ERROR "Crow headers not found. Install Crow and set CROW_INCLUDE_DIR.")
endif()
if(NOT MYSQLCPPCONN_INCLUDE_DIR OR NOT MYSQLCPPCONN_LIBRARY)
  message(FATAL_ERROR "MySQL Connector/C++ not found. Set MYSQLCPPCONN_INCLUDE_DIR and MYSQLCPPCONN_LIBRARY.")
endif()

add_executable(student_api src/main.cpp)
target_include_directories(student_api PRIVATE ${CROW_INCLUDE_DIR} ${MYSQLCPPCONN_INCLUDE_DIR})
target_link_libraries(student_api PRIVATE ${MYSQLCPPCONN_LIBRARY} Threads::Threads)

if(WIN32)
  target_link_libraries(student_api PRIVATE ws2_32)
endif()
