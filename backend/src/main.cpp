#include <crow.h>
#include <mysql/jdbc.h>

#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

std::string envOr(const char* key, const char* fallback) {
    const char* value = std::getenv(key);
    return value ? value : fallback;
}

int envInt(const char* key, int fallback) {
    const char* value = std::getenv(key);
    if (!value) return fallback;
    try { return std::stoi(value); } catch (...) { return fallback; }
}

struct Student {
    int id{};
    std::string name;
    std::string email;
    std::string phone;
    int age{};
    std::string department;
};

// DSA demo: iterative linear search over records.
std::optional<std::size_t> linearSearch(const std::vector<Student>& rows, const std::string& term) {
    for (std::size_t i = 0; i < rows.size(); ++i) {
        if (rows[i].name.find(term) != std::string::npos ||
            rows[i].email.find(term) != std::string::npos ||
            rows[i].department.find(term) != std::string::npos) return i;
    }
    return std::nullopt;
}

// DSA demo: merge sort by student name.
void mergeSort(std::vector<Student>& values, std::size_t left, std::size_t right) {
    if (right - left < 2) return;
    const std::size_t middle = left + (right - left) / 2;
    mergeSort(values, left, middle);
    mergeSort(values, middle, right);
    std::vector<Student> merged;
    merged.reserve(right - left);
    std::size_t i = left, j = middle;
    while (i < middle && j < right) {
        if (values[i].name <= values[j].name) merged.push_back(values[i++]);
        else merged.push_back(values[j++]);
    }
    while (i < middle) merged.push_back(values[i++]);
    while (j < right) merged.push_back(values[j++]);
    for (std::size_t k = 0; k < merged.size(); ++k) values[left + k] = std::move(merged[k]);
}

class Database {
public:
    Database() {
        const std::string host = "tcp://" + envOr("DB_HOST", "127.0.0.1") + ":" + envOr("DB_PORT", "3306");
        const std::string user = envOr("DB_USER", "root");
        const std::string password = envOr("DB_PASSWORD", "change_me");
        const std::string name = envOr("DB_NAME", "student_management");
        driver_ = sql::mysql::get_mysql_driver_instance();
        connection_.reset(driver_->connect(host, user, password));
        connection_->setSchema(name);
    }

    std::vector<Student> all() {
        std::lock_guard<std::mutex> lock(mutex_);
        std::vector<Student> rows;
        std::unique_ptr<sql::PreparedStatement> statement(connection_->prepareStatement(
            "SELECT s.id, s.name, s.email, COALESCE(s.phone,''), s.age, d.name "
            "FROM students s LEFT JOIN departments d ON s.department_id=d.id ORDER BY s.id"));
        std::unique_ptr<sql::ResultSet> result(statement->executeQuery());
        while (result->next()) rows.push_back({result->getInt(1), result->getString(2), result->getString(3),
            result->getString(4), result->getInt(5), result->isNull(6) ? "Unassigned" : result->getString(6)});
        return rows;
    }

    crow::json::wvalue toJson(const Student& s) {
        crow::json::wvalue item;
        item["id"] = s.id; item["name"] = s.name; item["email"] = s.email;
        item["phone"] = s.phone; item["age"] = s.age; item["department"] = s.department;
        return item;
    }

    int departmentId(const std::string& name) {
        std::unique_ptr<sql::PreparedStatement> statement(connection_->prepareStatement("SELECT id FROM departments WHERE name=?"));
        statement->setString(1, name);
        std::unique_ptr<sql::ResultSet> result(statement->executeQuery());
        return result->next() ? result->getInt(1) : 0;
    }

    crow::response add(const crow::json::rvalue& body) {
        const std::string name = body["name"].s();
        const std::string email = body["email"].s();
        const std::string phone = body.has("phone") ? body["phone"].s() : "";
        const int age = body.has("age") ? static_cast<int>(body["age"].i()) : 18;
        const std::string department = body.has("department") ? body["department"].s() : "";
        std::lock_guard<std::mutex> lock(mutex_);
        const int deptId = departmentId(department);
        std::unique_ptr<sql::PreparedStatement> statement(connection_->prepareStatement(
            "INSERT INTO students(name,email,phone,age,department_id) VALUES(?,?,?,?,NULLIF(?,0))"));
        statement->setString(1, name); statement->setString(2, email); statement->setString(3, phone);
        statement->setInt(4, age); statement->setInt(5, deptId); statement->executeUpdate();
        return crow::response(201, "{\"message\":\"Student added\"}");
    }

    crow::response update(int id, const crow::json::rvalue& body) {
        const std::string name = body["name"].s();
        const std::string email = body["email"].s();
        const std::string phone = body.has("phone") ? body["phone"].s() : "";
        const int age = body.has("age") ? static_cast<int>(body["age"].i()) : 18;
        const std::string department = body.has("department") ? body["department"].s() : "";
        std::lock_guard<std::mutex> lock(mutex_);
        const int deptId = departmentId(department);
        std::unique_ptr<sql::PreparedStatement> statement(connection_->prepareStatement(
            "UPDATE students SET name=?,email=?,phone=?,age=?,department_id=NULLIF(?,0) WHERE id=?"));
        statement->setString(1, name); statement->setString(2, email); statement->setString(3, phone);
        statement->setInt(4, age); statement->setInt(5, deptId); statement->setInt(6, id);
        const int changed = statement->executeUpdate();
        return changed ? crow::response(200, "{\"message\":\"Student updated\"}") : crow::response(404, "{\"error\":\"Student not found\"}");
    }

    crow::response remove(int id) {
        std::lock_guard<std::mutex> lock(mutex_);
        std::unique_ptr<sql::PreparedStatement> statement(connection_->prepareStatement("DELETE FROM students WHERE id=?"));
        statement->setInt(1, id);
        const int changed = statement->executeUpdate();
        return changed ? crow::response(200, "{\"message\":\"Student deleted\"}") : crow::response(404, "{\"error\":\"Student not found\"}");
    }

    bool connected() {
        std::lock_guard<std::mutex> lock(mutex_);
        return connection_ && connection_->isValid();
    }
private:
    sql::mysql::MySQL_Driver* driver_{};
    std::unique_ptr<sql::Connection> connection_;
    std::mutex mutex_;
};

} // namespace

int main() {
    crow::SimpleApp app;
    std::unique_ptr<Database> db;
    try { db = std::make_unique<Database>(); }
    catch (const std::exception& ex) {
        std::cerr << "Database connection failed: " << ex.what() << '\n';
        return 1;
    }

    CROW_ROUTE(app, "/api/health")([&db] {
        crow::json::wvalue response;
        response["status"] = "ok";
        response["database"] = db->connected() ? "connected" : "disconnected";
        return crow::response(200, response);
    });

    CROW_ROUTE(app, "/api/students").methods(crow::HTTPMethod::GET)([&db](const crow::request& req) {
        try {
            auto rows = db->all();
            const char* search = req.url_params.get("search");
            const char* sort = req.url_params.get("sort");
            if (search && *search) {
                std::vector<Student> filtered;
                const std::string term(search);
                for (const auto& s : rows)
                    if (s.name.find(term) != std::string::npos || s.email.find(term) != std::string::npos || s.department.find(term) != std::string::npos)
                        filtered.push_back(s);
                rows = std::move(filtered);
            }
            if (sort && std::string(sort) == "name") mergeSort(rows, 0, rows.size());
            crow::json::wvalue result;
            result["data"] = crow::json::wvalue::list();
            for (const auto& row : rows) result["data"].push_back(db->toJson(row));
            return crow::response(200, result);
        } catch (const std::exception& ex) {
            crow::json::wvalue error; error["error"] = ex.what();
            return crow::response(500, error);
        }
    });

    CROW_ROUTE(app, "/api/students").methods(crow::HTTPMethod::POST)([&db](const crow::request& req) {
        try {
            auto body = crow::json::load(req.body);
            if (!body || !body.has("name") || !body.has("email")) return crow::response(400, "{\"error\":\"name and email are required\"}");
            return db->add(body);
        } catch (const std::exception& ex) { return crow::response(400, std::string("{\"error\":\"") + ex.what() + "\"}"); }
    });

    CROW_ROUTE(app, "/api/students/<int>").methods(crow::HTTPMethod::PUT)([&db](const crow::request& req, int id) {
        try {
            auto body = crow::json::load(req.body);
            if (!body || !body.has("name") || !body.has("email")) return crow::response(400, "{\"error\":\"name and email are required\"}");
            return db->update(id, body);
        } catch (const std::exception& ex) { return crow::response(400, std::string("{\"error\":\"") + ex.what() + "\"}"); }
    });

    CROW_ROUTE(app, "/api/students/<int>").methods(crow::HTTPMethod::DELETE)([&db](int id) { return db->remove(id); });

    const int port = envInt("API_PORT", 8080);
    std::cout << "Student Record API listening on http://localhost:" << port << '\n';
    app.port(static_cast<std::uint16_t>(port)).multithreaded().run();
}
