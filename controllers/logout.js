module.exports = (req, res) => {
  req.session.destroy(() => {
    console.log("Ashche");

    res.redirect("/");
  });
};
