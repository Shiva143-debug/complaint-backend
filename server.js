const express = require('express');
const { Pool } = require('pg');
const cors = require('cors')
const axios = require('axios')
const bodyParser = require('body-parser');
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')

const nodemailer = require("nodemailer");


const pool = new Pool({
    user: 'oss_admin',
    host: '148.72.246.179',
    database: 'complaint',
    password: 'Latitude77',
    schema: "public",
    port: '5432',
});


const PasswordGenerator = {
    alpha: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    integers: "0123456789",
    length: 6,
    createPassword: function () {
        const chars = this.alpha + this.integers;
        const password = Array.from({ length: this.length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        return password;
    },
};


const sendNewPasswordToEmail = async (name, email, newPassword) => {
    const mailOptions = {
        from: `"Was" <was@wheresoft.in>`,
        to: email,
        subject: `Dear ${name} Your Account was Successfully Created.`,
        text: `Your new password is: ${newPassword}`,
    };

    const transporter = nodemailer.createTransport({
        host: "india7.hostcloudstore.com",
        port: 25,
        secure: false,
        auth: {
            user: "was@wheresoft.in",
            pass: "Latitude77",
        },
    });

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to", email);
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw new Error("Failed to send email");
    }
};

const typeDefs = `
    type User {
        id: Int!
        name: String!
        email: String!
        phone: String!
        role:Role!
        password:String!
    }

    type Status {
    id: Int!
    name: String!
    description: String!

}

    type Complaint {
        id: ID!
        description: String!
        status: Status
        user: User
        assignedOfficer: Officer
        created_at: String
        updated_at: String
        user_id: ID!
        assigned_officer_id: ID!
        status_id:ID!
    }

    type Officer {
        id: Int!
        name: String!
        email: String!
        phone: String!
        role:Role!
        password:String!
    }

    type Resolution {
        id: ID!
        complaint_id: Int!
        resolvedBy: Officer
        resolution_note: String!
        resolved_at: String!
    }

    type AuditLog {
        id: ID!
        complaint: Complaint!
        action: String!
        performedBy: Officer!
        timestamp: String
        details: String!
        
    }

    type Role{
    id: Int!
    role_name:String!
    access_function:String!
    }

    type Permission{
    id:Int!
    permission_name:String!
    permission_code:String!
    }

    type Query {
        getComplaints: [Complaint]
        getUsers: [User]
        getOfficers: [Officer]
        getStatuses:[Status]
        getResolutions:[Resolution]
        getAuditLogs:[AuditLog]
        getRoles:[Role]
        getPermissions:[Permission]

        getComplaintById(user_id: ID!): [Complaint]
        getUser(id: ID!): User
        getOfficer(id: ID!): Officer
        getStatus(id: ID!):Status
        getResolution(complaint_id: ID!): Resolution
        getAuditLog(complaint_id: ID!): [AuditLog]
    }

    type Mutation{
       addComplaint(complaint:AddComplaintInput!):Complaint
       addUser(user:AddUserInput!):User
       addOfficer(officer:AddOfficerInput!):Officer
       addAudit(audit:AddAuditInput!):AuditLog
       addRole(role: AddRoleInput!): Role

       updateResolution(resolution: UpdateResolutionInput!): Resolution
       updateComplaint(complaint:UpdatecomplaintInput!):Complaint

       deleteUser(id: ID!): User
       deleteOfficer(id: ID!): Officer
       deleteRole(id: ID!): Role

    }

    input AddRoleInput {
        role_name: String!
        access_function: String!
    }

    input AddComplaintInput{
       description:String!
       user_id:ID!
       assigned_officer_id:ID!
       status_id:Int!
    }

    input AddUserInput{
       name:String!
       email:String!
       phone:String!
       role_id:Int!
       password:String
       
    }
    input AddOfficerInput{
       name:String!
       email:String!
       phone:String!
       role_id:Int!
       password:String
       
    }

        input AddAuditInput{       
        complaint_id: Int!
        action: String!
        performed_by: Int!
        details: String!
    }

    input UpdateResolutionInput {
        id: Int! 
        complaint_id: Int
        resolution_note: String!
        resolved_by: Int

}
        input UpdatecomplaintInput{
        id: Int!
        status_id:Int!
        }
`;


const resolvers = {
    Complaint: {
        user: async (complaint) => {
            try {
                const result = await pool.query(`SELECT * FROM users where id=$1`, [complaint.user_id]);
                console.log(result.rows[0])
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        status: async (complaint) => {
            try {
                const result = await pool.query(`SELECT * FROM status where id=$1`, [complaint.status_id]);
                console.log(result.rows[0])
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        assignedOfficer: async (complaint) => {
            try {
                const result = await pool.query(`SELECT * FROM officers where id=$1`, [complaint.assigned_officer_id]);
                console.log(result.rows[0])
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },

    },
    Resolution: {

        resolvedBy: async (resolution) => {
            try {
                const result = await pool.query(`SELECT * FROM officers where id=$1`, [resolution.resolved_by]);
                console.log(result.rows[0])
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        }
    },
    AuditLog: {

        performedBy: async (auditLog) => {
            try {
                const result = await pool.query(`SELECT * FROM officers where id=$1`, [auditLog.performed_by]);
                console.log(result.rows[0])
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        complaint: async (auditLog) => {
            try {
                const result = await pool.query(`SELECT * FROM complaints_table where id=$1`, [auditLog.complaint_id]);
                console.log(result.rows[0])
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        }
    },
    User: {

        role: async (user) => {
            try {
                const result = await pool.query(`SELECT * FROM roles where id=$1`, [user.role_id]);
                console.log(result.rows[0])
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        }
    },
    Officer: {

        role: async (officer) => {
            try {
                const result = await pool.query(`SELECT * FROM roles where id=$1`, [officer.role_id]);
                console.log(result.rows[0])
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        }
    },
    Query: {

        getUsers: async () => {
            try {
                const result = await pool.query("SELECT * FROM users");
                return result.rows

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getOfficers: async () => {
            try {
                const result = await pool.query("SELECT * FROM officers");
                return result.rows

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getComplaints: async () => {
            try {
                const result = await pool.query("SELECT * FROM complaints_table");
                return result.rows

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getStatuses: async () => {
            try {
                const result = await pool.query("SELECT * FROM status");
                return result.rows

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getRoles: async () => {
            try {
                const result = await pool.query("SELECT * FROM roles");
                return result.rows

            } catch (err) {
                console.error("Error fetching roles:", err);
                throw new Error("Failed to fetch roles");
            }
        },
        getPermissions: async () => {
            try {
                const result = await pool.query("SELECT * FROM permissions");
                return result.rows

            } catch (err) {
                console.error("Error fetching permissions:", err);
                throw new Error("Failed to fetch permissions");
            }
        },
        getResolutions: async () => {
            try {
                const result = await pool.query("SELECT * FROM resolution");
                return result.rows

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getAuditLogs: async () => {
            try {
                const result = await pool.query("SELECT * FROM audit_log");
                return result.rows

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getUser: async (_, args) => {
            try {
                const result = await pool.query(`SELECT * FROM users where id=$1`, [args.id]);
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getOfficer: async (_, args) => {
            try {
                const result = await pool.query(`SELECT * FROM officers where id=$1`, [args.id]);
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getStatus: async (_, args) => {
            try {
                const result = await pool.query(`SELECT * FROM status where id=$1`, [args.id]);
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getComplaintById: async (_, args) => {
            try {
                const result = await pool.query(`SELECT * FROM complaints_table where user_id=$1`, [args.user_id]);
                return result.rows

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        // getRoleById: async (_,args) => {
        //     try {
        //         const result = await pool.query(`SELECT * FROM roles where id=$1`,[args.id]);
        //         return result.rows

        //     } catch (err) {
        //         console.error("Error fetching roles:", err);
        //         throw new Error("Failed to fetch roles");
        //     }
        // },

        getResolution: async (_, args) => {
            try {
                const result = await pool.query(`SELECT * FROM resolution where complaint_id=$1`, [args.complaint_id]);
                return result.rows[0]

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },
        getAuditLog: async (_, args) => {
            try {
                const result = await pool.query(`SELECT * FROM audit_log where complaint_id=$1`, [args.complaint_id]);
                return result.rows

            } catch (err) {
                console.error("Error fetching complaints:", err);
                throw new Error("Failed to fetch complaints");
            }
        },

    },
    Mutation: {
        addComplaint: async (_, { complaint }) => {
            const { description, user_id, assigned_officer_id, status_id } = complaint;
            const query = `INSERT INTO complaints_table (description, user_id, assigned_officer_id,created_at,updated_at, status_id)
            VALUES ($1, $2, $3, NOW(),NOW(), $4)
            RETURNING *;
          `;

            try {
                const result = await pool.query(query, [description, user_id, assigned_officer_id, status_id]);
                const complaint_id = result.rows[0].id;
                const auditQuery = `INSERT INTO audit_log (complaint_id, action, performed_by, timestamp, details) VALUES ($1, $2, $3, NOW(), $4)`;
                const action = 'Complaint Filed';
                const performed_by = user_id;
                const details = `Complaint with ID ${complaint_id} was created: ${description}`;
                await pool.query(auditQuery, [complaint_id, action, performed_by, details]);
                return result.rows[0];
            } catch (err) {
                console.error("Error adding complaint:", err);
                throw new Error("Failed to add complaint");
            }
        },
        addUser: async (_, { user }) => {
            const { name, email, phone, role_id } = user;
            const newPassword = PasswordGenerator.createPassword();
            const query = `INSERT INTO users (name,email,phone,role_id,password)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING *;
            `;

            try {
                const result = await pool.query(query, [name, email, phone, role_id, newPassword]);
                const addedUser = result.rows[0];
                await sendNewPasswordToEmail(name, email, newPassword);
                return addedUser;
            } catch (err) {
                console.error("Error adding user:", err);
                throw new Error("Failed to add user");
            }
        },
        addOfficer: async (_, { officer }) => {
            const { name, email, phone, role_id } = officer;
            const newPassword = PasswordGenerator.createPassword();
            const query = `INSERT INTO officers (name,email,phone,role_id,password)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING *;
            `;

            try {
                const result = await pool.query(query, [name, email, phone, role_id, newPassword]);
                const addedUser = result.rows[0];
                await sendNewPasswordToEmail(name, email, newPassword);
                return addedUser;
            } catch (err) {
                console.error("Error adding Officer:", err);
                throw new Error("Failed to add Officer");
            }
        },
        addAudit: async (_, { audit }) => {
            const { complaint_id, action, performed_by, details } = audit;
            const query = `INSERT INTO audit_log (complaint_id,action,performed_by, timestamp,details)
              VALUES ($1, $2, $3,NOW(),$4)
              RETURNING *;
            `;

            try {
                const result = await pool.query(query, [complaint_id, action, performed_by, details]);
                return result.rows[0];
            } catch (err) {
                console.error("Error adding complaint:", err);
                throw new Error("Failed to add complaint");
            }
        },

        addRole: async (_, { role }) => {
            const { role_name, access_function } = role;

            if (!role_name || !access_function || access_function.length === 0) {
                throw new Error("Role name and access functions are required.");
            }

            try {
                // Insert the role into the roles table
                const result = await pool.query(
                    `INSERT INTO roles (role_name, access_function) VALUES ($1, $2) RETURNING *`,
                    [role_name, access_function]
                );

                return {
                    id: result.rows[0].id,
                    role_name: result.rows[0].role_name,
                    access_function: JSON.parse(result.rows[0].access_function),
                };
            } catch (error) {
                console.error("Error adding role:", error);
                throw new Error("Failed to add role.");
            }
        },


        updateResolution: async (_, { resolution }) => {
            const { id, resolved_by, resolution_note } = resolution;
            const query = `
              UPDATE resolution
              SET 
                  resolved_by = $1,
                  resolution_note = $2,
                  resolved_at = NOW()
              WHERE complaint_id = $3
              RETURNING *;
            `;

            try {
                const result = await pool.query(query, [resolved_by, resolution_note, id]);
                if (result.rows.length === 0) {
                    throw new Error(`resolution with id ${id} not found.`);
                }
                return result.rows[0];
            } catch (err) {
                console.error("Error updating resolution:", err);
                throw new Error("Failed to update resolution");
            }
        },
        updateComplaint: async (_, { complaint }) => {
            const { id, status_id } = complaint;
            const query = `
              UPDATE complaints_table
              SET 
                  status_id = $1,
                  updated_at = NOW()
              WHERE id = $2
              RETURNING *;
            `;

            try {
                const result = await pool.query(query, [status_id, id]);
                if (result.rows.length === 0) {
                    throw new Error(`complaint with id ${id} not found.`);
                }
                return result.rows[0];
            } catch (err) {
                console.error("Error updating complaint:", err);
                throw new Error("Failed to update complaint");
            }
        },

        deleteUser: async (_, { id }) => {
            try {
                const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
                if (result.rowCount === 0) {
                    throw new Error('User not found');
                }
                return result.rows[0]; 
            } catch (error) {
                console.error('Error deleting user:', error);
                throw new Error('Failed to delete user');
            }
        },
        deleteOfficer: async (_, { id }) => {
            try {
                const result = await pool.query('DELETE FROM officers WHERE id = $1 RETURNING *', [id]);
                if (result.rowCount === 0) {
                    throw new Error('Officer not found');
                }
                return result.rows[0]; 
            } catch (error) {
                console.error('Error deleting officer:', error);
                throw new Error('Failed to delete officer');
            }
        },
        deleteRole: async (_, { id }) => {
            try {
                const result = await pool.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
                if (result.rowCount === 0) {
                    throw new Error('role not found');
                }
                return result.rows[0]; 
            } catch (error) {
                console.error('Error deleting role:', error);
                throw new Error('Failed to delete role');
            }
        },
    },

};

async function startServer() {
    const app = express();
    const server = new ApolloServer({ typeDefs, resolvers });
    app.use(cors())
    app.use(express.json())
    app.use(bodyParser.json());

    await server.start()
    app.use("/graphql", expressMiddleware(server));

    app.listen(3005, () => console.log("server on 3005"))
}

startServer()




