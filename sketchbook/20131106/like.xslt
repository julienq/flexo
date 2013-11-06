<xsl:transform version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" encoding="utf-8"/>

  <xsl:template match="PLAY">
    <xsl:variable name="title">
      A Valley Girl totally tells <xsl:value-of select="TITLE"/>
    </xsl:variable>
    <html>
      <head>
        <title><xsl:value-of select="$title"/></title>
        <link rel="stylesheet" href="shakespeare.css"/>
      </head>
      <body>
        <h1><xsl:value-of select="$title"/></h1>
        <p class="note">Okay, so I totally got these <em>awesome</em> <a
            href="http://xml.coverpages.org/bosakShakespeare200.html">Shakespeare
            XML files</a> and, like, applied this <a href="like.xslt">XSLT
            stylesheet</a>, or something. I still have these <em>gross</em>
          <span class="stagedir">stage directions</span> to take care of though,
          so <em>please</em> guys, don’t be all like, what’s these, OK?</p>
        <xsl:apply-templates select="ACT"/>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="ACT">
    <section>
      <h2>So this is like, <xsl:value-of select="TITLE"/></h2>
    </section>
    <xsl:apply-templates select="PROLOGUE"/>
    <xsl:apply-templates select="SCENE"/>
  </xsl:template>

  <xsl:template match="PROLOGUE">
    <section>
      <xsl:apply-templates select="SPEECH|STAGEDIR"/>
    </section>
  </xsl:template>

  <xsl:template match="SCENE">
    <section>
      <h3>Now it’s like, <xsl:value-of select="TITLE"/></h3>
      <xsl:apply-templates select="SPEECH|STAGEDIR"/>
    </section>
  </xsl:template>

  <xsl:template match="LINE/STAGEDIR">
    <span class="stagedir">
      (<xsl:apply-templates/>)
    </span>
  </xsl:template>

  <xsl:template match="STAGEDIR">
    <xsl:variable name="direction" select="."/>
    <xsl:choose>
      <xsl:when test="starts-with($direction, 'Enter ')">
        <p>
          <xsl:choose>
            <xsl:when test="contains($direction, 'and')">
              <xsl:value-of select="substring-after($direction, 'Enter ')"/>
              totally come in.
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="substring-after($direction, 'Enter ')"/>,
              like, arrives.
            </xsl:otherwise>
          </xsl:choose>
        </p>
      </xsl:when>
      <xsl:when test="starts-with($direction, 'Exeunt ')">
        <p>
          Then <xsl:value-of
            select="concat(substring-after($direction, 'Exeunt '), ', ')"/> are
          all like, Catch you later.
        </p>
      </xsl:when>
      <xsl:when test="starts-with($direction, 'Exit ')">
        <p>
          And <xsl:value-of select="substring-after($direction, 'Exit ')"/>
          goes, I’m out.
        </p>
      </xsl:when>
      <xsl:when test="$direction='Exit'">
        <p>And <xsl:value-of select="preceding-sibling::SPEECH[1]/SPEAKER"/>
          like, gets totally out.</p>
      </xsl:when>
      <xsl:when test="$direction='Retires'">
        <p>Then <xsl:value-of select="preceding-sibling::SPEECH[1]/SPEAKER"/>
          gets out of there.</p>
      </xsl:when>
      <xsl:when test="$direction='Exeunt'">
        <p>And then, they’re all, like, <em>gone</em>.</p>
      </xsl:when>
      <xsl:when test="$direction='Dies'">
        <p>Then <em>Oh my God</em>! <xsl:value-of
            select="preceding-sibling::SPEECH[1]/SPEAKER"/> like, totally
          <em>dies</em>! For real!</p>
      </xsl:when>
      <xsl:otherwise>
        <span class="stagedir">
          (<xsl:apply-templates/>)
        </span>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="SPEECH">
    <p>
      <xsl:choose>
        <xsl:when test="SPEAKER[normalize-space()]">
          <xsl:if test="preceding-sibling::SPEECH">
            So
          </xsl:if>
          <xsl:value-of select="SPEAKER"/> is like,
        </xsl:when>
        <xsl:otherwise>
          Oh my God, guys!
        </xsl:otherwise>
      </xsl:choose>
      <xsl:apply-templates select="LINE"/>
    </p>
  </xsl:template>

  <xsl:template match="LINE">
    <xsl:apply-templates/>
    <xsl:if test="not(position()=last())">
      <xsl:text>&#xa;</xsl:text>
    </xsl:if>
  </xsl:template>

</xsl:transform>

