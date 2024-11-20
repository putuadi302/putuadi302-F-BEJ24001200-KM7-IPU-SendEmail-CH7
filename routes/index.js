const router = require("express").Router();

const authController = require("../controllers/authControllers");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/sign-in", authController.signIn);
router.get("/sign-up", authController.signUp);

router.get("/confirmEmail", authController.confirmEmail);
router.post("/verifyEmail", authController.verifyEmail);

router.get("/forgetPassword/:token", authController.forgetPassword);
router.post("/resetPassword", authController.resetPassword);

module.exports = router;
