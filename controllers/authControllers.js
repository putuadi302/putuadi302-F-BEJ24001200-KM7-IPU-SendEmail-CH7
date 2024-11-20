const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_SALT = parseInt(process.env.BCRYPT_SALT);

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      const uniqueEmail = await prisma.user.findUnique({ where: { email } });
      if (uniqueEmail) {
        throw {
          status: 400,
          message: "Email sudah terdaftar",
        };
      }

      const hashedPassword = bcrypt.hashSync(password, BCRYPT_SALT);
      const createUser = await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });

      res.status(201).json({
        status: "success",
        message: "User berhasil dibuat, silahkan login",
        data: createUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !bcrypt.compareSync(password, user.password)) {
        throw {
          status: 400,
          message: "Email atau password salah",
        };
      }

      const accessToken = jwt.sign(
        { name: user.name, id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        status: "success",
        message: "Login berhasil",
        token: accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async signIn(req, res, next) {
    try {
      res.render("login");
    } catch (error) {
      next(error);
    }
  }

  static async signUp(req, res, next) {
    try {
      res.render("register");
    } catch (error) {
      next(error);
    }
  }

  static async confirmEmail(req, res, next) {
    try {
      res.render("confirmEmail");
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req, res, next) {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw {
          status: 400,
          message: "Email tidak ditemukan",
        };
      }

      const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_APP,
        },
      });

      const mailOptions = {
        from: process.env.USER_EMAIL,
        to: email,
        subject: "Reset Your Password",
        html: `<a href="http://localhost:3000/forgetPassword/${token}">Klik link ini untuk mereset password</a>`,
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          throw {
            status: 500,
            message: "Gagal mengirim email",
          };
        }
        res.redirect("/confirmEmail");
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgetPassword(req, res, next) {
    try {
      const { token } = req.params;

      if (!token) {
        throw {
          status: 400,
          message: "Token diperlukan",
        };
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded || !decoded.id) {
        throw {
          status: 401,
          message: "Token tidak valid",
        };
      }

      res.render("newPassword", { token });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { password, token } = req.body;

      if (!token || !password) {
        throw {
          status: 400,
          message: "Token dan password diperlukan",
        };
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded || !decoded.id) {
        throw {
          status: 401,
          message: "Token tidak valid",
        };
      }

      const hashedPassword = bcrypt.hashSync(password, BCRYPT_SALT);

      const updateUser = await prisma.user.update({
        where: { id: decoded.id },
        data: { password: hashedPassword },
      });

      res.status(200).json({
        status: "success",
        message: "Password berhasil direset, silakan login kembali",
        data: updateUser,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
